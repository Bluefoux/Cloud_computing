import registerEnv from './env.js';
import registerCors from './cors.js';
import registerLogger from './logger.js';
import registerMySQL from './mysql.js';

export default async function registerPlugins(app) {
  await registerEnv(app); // Load .env and config first
  await registerCors(app); // Enable CORS
  await registerLogger(app); // Apply logger
  await registerMySQL(app);
}
