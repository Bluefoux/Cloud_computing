import homeFunction1 from './homeFunction1.js';
import getcompFunction from './getcompfunction.js';
import addcompFunction from './addcompfunction.js';

// /public prefix is applied by parent
export default async function publicRoutes(app) {
  app.get('/home', getcompFunction);
  app.post('/add_competition', addcompFunction);
}
