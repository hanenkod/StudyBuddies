require("dotenv").config();

const mysql = require('mysql2/promise');

// Database connection configuration
const config = {
  host: process.env.DB_CONTAINER,
  port: process.env.DB_PORT,
  user: process.env.MYSQL_ROOT_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create a connection pool
const pool = mysql.createPool(config);

// Logging a successful connection to the database
pool.getConnection()
  .then(connection => {
    console.log('Successful connection to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1); // Termination of the process in case of connection error
  });

// Utility function for executing database queries
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('Error while executing the query:', err);
    throw err; // Throw an error for processing in the calling code
  }
}

// Export the query function for use in other modules
module.exports = {
  query,
};