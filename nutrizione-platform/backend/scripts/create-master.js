
require('dotenv').config()

const bcrypt = require('bcrypt')
const db = require('../src/config/database')

async function createMaster() {
    try {
        const email = process.env.MASTER_EMAIL?.trim().toLowerCase()
        const password = process.env.MASTER_PASSWORD

        if (!email || !password || password.length < 12) {
            throw new Error(
                'Email mancante o password inferiore a 12 caratteri'
            )
        }

        const existing = await db.query(
            'SELECT id FROM administrators LIMIT 1'
        )

        if (existing.rows.length) {
            throw new Error('Esiste già un account amministratore')
        }

        const passwordHash = await bcrypt.hash(password, 12)

        await db.query(
            `INSERT INTO administrators (email, password_hash, role)
             VALUES ($1, $2, 'master')`,
            [email, passwordHash]
        )

        console.log('Account Master creato correttamente:', email)

    } catch (error) {
        console.error('Errore:', error.message)
        process.exitCode = 1
    } finally {
        await db.end()
    }
}

createMaster()
