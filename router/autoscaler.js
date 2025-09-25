// autoscaler/autoscaler.js
import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';
import http from 'node:http';

const exec = promisify(_exec);

// ---- Config via env ----
const WATCH_LABEL   = process.env.WATCH_LABEL || 'traefik.http.services.api.loadbalancer.server.port';
const SERVICE_NAME  = process.env.SERVICE_NAME || 'api';
const MIN_REPLICAS  = parseInt(process.env.MIN_REPLICAS || '1', 10);
const MAX_REPLICAS  = parseInt(process.env.MAX_REPLICAS || '8', 10);
const SCALE_UP_CPU  = parseFloat(process.env.SCALE_UP_CPU || '70');    // %
const SCALE_DOWN_CPU= parseFloat(process.env.SCALE_DOWN_CPU || '30');  // %
const UPSCALE_STEP  = parseInt(process.env.UPSCALE_STEP || '1', 10);
const DOWNSCALE_STEP= parseInt(process.env.DOWNSCALE_STEP || '1', 10);
const WINDOW_SEC    = parseInt(process.env.WINDOW_SEC || '120', 10);
const INTERVAL_SEC  = parseInt(process.env.INTERVAL_SEC || '20', 10);
const COOLDOWN_SEC  = parseInt(process.env.COOLDOWN_SEC || '120', 10);
const COMPOSE_FILE  = process.env.COMPOSE_FILE || '/workspace/docker-compose.yml';

// Docker socket
const DOCKER_HOST = 'localhost';
const DOCKER_PORT = 2375; // we’ll use the unix socket via http+socket trick

// We’ll talk to /var/run/docker.sock by hijacking http agent
import net from 'node:net';
const agent = new http.Agent({ keepAlive: true });
agent.createConnection = (opts, oncreate) => {
  const socketPath = '/var/run/docker.sock';
  const socket = net.createConnection(socketPath);
  socket.on('connect', () => oncreate(null, socket));
  socket.on('error', oncreate);
  return socket;
};

function dockerApi(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { socketPath: '/var/run/docker.sock', path, method: 'GET', agent },
      (res) => {
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(buf));
            } catch {
              resolve(buf);
            }
          } else {
            reject(new Error(`Docker API ${path} ${res.statusCode}: ${buf}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function listApiContainers() {
  // Filter by label present on API containers
  const qs = encodeURIComponent(`label=${WATCH_LABEL}`);
  return dockerApi(`/containers/json?filters={"label":["${WATCH_LABEL}"]}`);
}

const usageHistory = []; // rolling window of {t, cpu}
let lastScaleAt = 0;

function pruneHistory() {
  const cutoff = Date.now() - WINDOW_SEC * 1000;
  while (usageHistory.length && usageHistory[0].t < cutoff) usageHistory.shift();
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Compute container CPU% from /containers/<id>/stats stream sample
function cpuPercentUnix(prev, cur) {
  const cpuDelta = cur.cpu_stats.cpu_usage.total_usage - prev.cpu_stats.cpu_usage.total_usage;
  const systemDelta = cur.cpu_stats.system_cpu_usage - prev.cpu_stats.system_cpu_usage;
  const onlineCPUs = cur.cpu_stats.online_cpus || cur.cpu_stats.cpu_usage.percpu_usage?.length || 1;
  if (cpuDelta > 0 && systemDelta > 0) {
    return (cpuDelta / systemDelta) * onlineCPUs * 100.0;
  }
  return 0;
}

async function sampleContainerCPU(containerId) {
  // Get two snapshots (cheap polling)
  const s1 = await dockerApi(`/containers/${containerId}/stats?stream=false`);
  // tiny delay
  await new Promise(r => setTimeout(r, 200));
  const s2 = await dockerApi(`/containers/${containerId}/stats?stream=false`);
  return cpuPercentUnix(s1, s2);
}

async function getAvgCpuAcrossApi() {
  const containers = await listApiContainers();
  if (!containers.length) return 0;
  const samples = await Promise.allSettled(
    containers.map(c => sampleContainerCPU(c.Id))
  );
  const values = samples
    .filter(s => s.status === 'fulfilled')
    .map(s => s.value)
    .filter(v => Number.isFinite(v));
  return average(values);
}

async function getCurrentReplicas() {
  // We infer by counting running API containers
  const containers = await listApiContainers();
  // Only count ones from our compose service name
  const filtered = containers.filter(c =>
    Object.entries(c.Labels || {}).some(([k, v]) =>
      (k === 'com.docker.compose.service' && v === SERVICE_NAME)
    )
  );
  return filtered.length;
}

async function scaleTo(n) {
  n = Math.max(MIN_REPLICAS, Math.min(MAX_REPLICAS, n));
  const cmd = `docker compose -f "${COMPOSE_FILE}" up -d --scale ${SERVICE_NAME}=${n}`;
  console.log(`[autoscaler] scaling: ${cmd}`);
  const { stdout, stderr } = await exec(cmd, { cwd: '/workspace', env: process.env });
  if (stderr) console.error(stderr);
  console.log(stdout);
  lastScaleAt = Date.now();
}

(async function mainLoop() {
  console.log(`[autoscaler] watching label="${WATCH_LABEL}" service="${SERVICE_NAME}"`);
  for (;;) {
    try {
      const cpu = await getAvgCpuAcrossApi();
      usageHistory.push({ t: Date.now(), cpu });
      pruneHistory();
      const windowAvg = average(usageHistory.map(s => s.cpu));

      const replicas = await getCurrentReplicas();
      const sinceScale = (Date.now() - lastScaleAt) / 1000;
      const cooled = sinceScale >= COOLDOWN_SEC;

      console.log(`[autoscaler] replicas=${replicas} cpu_now=${cpu.toFixed(1)}% window_avg=${windowAvg.toFixed(1)}%`);

      if (cooled && windowAvg > SCALE_UP_CPU && replicas < MAX_REPLICAS) {
        await scaleTo(replicas + UPSCALE_STEP);
      } else if (cooled && windowAvg < SCALE_DOWN_CPU && replicas > MIN_REPLICAS) {
        await scaleTo(replicas - DOWNSCALE_STEP);
      }
    } catch (e) {
      console.error('[autoscaler] error:', e.message);
    }
    await new Promise(r => setTimeout(r, INTERVAL_SEC * 1000));
  }
})();
