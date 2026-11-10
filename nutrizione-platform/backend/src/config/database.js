
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
})

pool.on('error', (err) => {
    console.error('Errore PostgreSQL:', err.message)
})

module.exports = pool
