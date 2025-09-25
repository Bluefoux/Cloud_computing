import fastifyEnv from '@fastify/env';

export default async function registerEnv(app) {
  const schema = {
    type: 'object',
    required: ['NODE_ENV'],
    properties: {
      NODE_ENV: { type: 'string' },
      PORT: { type: 'number', default: 3000 },
      DATABASE_URL: { type: 'string' },
    },
  };

  await app.register(fastifyEnv, {
    schema,
    dotenv: true,
  });
}
