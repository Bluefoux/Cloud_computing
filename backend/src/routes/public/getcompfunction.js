export default async function getcompFunction(req, reply) {
  try {
    const [rows] = await req.server.mysql.query('SELECT * FROM COMPETITION');
    return rows; // Fastify auto-serializes to JSON
  } catch (err) {
    req.server.log.error(err);
    reply.code(500).send({ error: 'Database error' });
  }
}