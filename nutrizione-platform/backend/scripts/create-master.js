
require('dotenv').config()

const db = require('../src/config/database')
const bcrypt = require('bcrypt')

async function createDemoAdmin() {
    try {
        const email = process.env.DEMO_EMAIL
        const password = process.env.DEMO_PASSWORD

        if (!email || !password) {
            throw new Error('DEMO_EMAIL e DEMO_PASSWORD obbligatorie')
        }

        if (password.length < 12) {
            throw new Error('La password deve avere almeno 12 caratteri')
        }

        // Controlla se l'account esiste già
        const existing = await db.query(
            `SELECT id FROM administrators
             WHERE LOWER(email) = LOWER($1)`,
            [email.trim()]
        )

        if (existing.rows.length) {
            console.log('Account già esistente. Nessuna modifica effettuata.')
            return
        }

        // Genera hash della password
        const passwordHash = await bcrypt.hash(password, 12)

        // Crea amministratore master
        const result = await db.query(
            `INSERT INTO administrators
                (email, password_hash, role)
             VALUES ($1, $2, $3)
             RETURNING id, email, role`,
            [email.trim(), passwordHash, 'master']
        )

        console.log('Account demo creato:', result.rows[0])

    } catch (error) {
        console.error('Errore:', error.message)
        process.exitCode = 1
    } finally {
        if (typeof db.end === 'function') {
            await db.end()
        }
    }
}

createDemoAdmin()
