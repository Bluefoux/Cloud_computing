import cors from '@fastify/cors';

export default async function registerCors(app) {
  await app.register(cors, {
    origin: "*",
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
    strictPreflight: false,
    preflightContinue: false,
  });
}

