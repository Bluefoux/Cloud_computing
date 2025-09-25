// handlers/createCompetition.js
export default async function addcompFunction(req, reply) {
  try {
    const {
      CompName,
      StartDate,
      EndDate,
      CompetitionVenue,
      Organizer,
      NumberOfLanes,
      Length,
      IndividualStartFee,
      RelayStartFee,
      Description
    } = req.body;

    if (!CompName || !StartDate || !EndDate) {
      return reply.code(400).send({ error: 'CompName, StartDate, and EndDate are required' });
    }

    const sql = `
      INSERT INTO COMPETITION
      (CompName, StartDate, EndDate, CompetitionVenue, Organizer, NumberOfLanes, Length, IndividualStartFee, RelayStartFee, Description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      CompName,
      StartDate,
      EndDate,
      CompetitionVenue,
      Organizer,
      NumberOfLanes,
      Length,
      IndividualStartFee,
      RelayStartFee,
      Description
    ];

    const [result] = await req.server.mysql.query(sql, values);

    // Return the inserted ID
    return { id: result.insertId, message: 'Competition created successfully' };
  } catch (err) {
    req.server.log.error(err);
    reply.code(500).send({ error: 'Database error' });
  }
}
