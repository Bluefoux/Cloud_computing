import app from './src/application.js';
import fs from 'fs';

const start = async () => {
  try {
    const startTime = Date.now();
    app.cc.info('Initializing server...', 'SYS');
    const port = 3300;
    await app.listen({ port, host: '0.0.0.0' });
    const duration = Date.now() - startTime;
    app.cc.success(`Server is running...`, 'SYS');
    app.cc.debug(`Startup process took ${duration}ms`, 'SYS');
    app.cc.block(
      'Config',
      {
        environment: process.env.NODE_ENV,
        port: process.env.PORT,
        log: process.env.LOG_LEVEL,
      },
      { level: 'info', context: 'SYS' }
    );

    // Test DB connection
    try {
      const schemaSQL = fs.readFileSync("./mydb.sql", "utf8");
      await app.mysql.query(schemaSQL);
      app.cc.success('Connected to MySQL', 'DB');
    } catch (dbErr) {
      app.cc.error('MySQL connection failed:', 'DB');
      app.cc.error(dbErr.message || dbErr, 'DB');
    }

  } catch (err) {
    app.cc.error('Failed to start', 'SYS');
    app.cc.error(err.message || err, 'SYS');
    process.exit(1);
  }
};

start();

