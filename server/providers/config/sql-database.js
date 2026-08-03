const mysql = require('mysql2/promise');

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 20,
    waitForConnections: true,
    namedPlaceholders: true
  });
}

let pool;

exports.connect = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};
