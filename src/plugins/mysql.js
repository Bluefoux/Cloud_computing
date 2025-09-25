//import fastifyMysql from "@fastify/mysql";
//import { isMySQLConnection } from "mysql2";
import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';

async function mysqlPlugin(fastify, options) {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  
  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
  });

  fastify.decorate('mysql', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
}

export default fp(mysqlPlugin);

