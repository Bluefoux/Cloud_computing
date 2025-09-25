import publicRoutes from './public/exports.js';

export default async function registerRoutes(app, opts) {
  await app.register(publicRoutes, { prefix: '/public' });
}
