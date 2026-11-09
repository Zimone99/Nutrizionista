
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true }
        : false,
    connectionTimeoutMillis: 5000
})

pool.on('error', (err) => {
    console.error('Errore PostgreSQL:', err.message)
})

module.exports = pool
