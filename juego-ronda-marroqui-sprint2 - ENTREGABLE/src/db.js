
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'ronda_user',
    password: 'ronda_password',
    database: 'ronda_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 
 * @param {string} sql
 * @param {Array} values
 * @returns {Promise<Array>} 
 */
async function query(sql, values) {
    try {
        const [results] = await pool.query(sql, values);
        return results;
    } catch (error) {
        console.error("Error al ejecutar consulta SQL:", error.message);
        throw new Error("Error interno del servidor al interactuar con la base de datos.");
    }
}

module.exports = {
    query,
    pool
};