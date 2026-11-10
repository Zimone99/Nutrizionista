
require('dotenv').config()

const db = require('./src/config/database')

const patients = [
    ['Mario', 'Rossi', 'mario.rossi@example.com', '3330000001', '1985-03-12', 'male'],
    ['Giulia', 'Bianchi', 'giulia.bianchi@example.com', '3330000002', '1992-07-24', 'female'],
    ['Luca', 'Ferrari', 'luca.ferrari@example.com', '3330000003', '1978-11-05', 'male'],
    ['Francesca', 'Romano', 'francesca.romano@example.com', '3330000004', '1990-01-18', 'female'],
    ['Andrea', 'Gallo', 'andrea.gallo@example.com', '3330000005', '1965-09-30', 'male'],
    ['Sofia', 'Conti', 'sofia.conti@example.com', '3330000006', '2000-05-14', 'female'],
    ['Alessandro', 'Greco', 'alessandro.greco@example.com', '3330000007', '1988-12-02', 'male'],
    ['Chiara', 'Marino', 'chiara.marino@example.com', '3330000008', '1975-04-21', 'female'],
    ['Matteo', 'Bruno', 'matteo.bruno@example.com', '3330000009', '1995-08-09', 'male'],
    ['Elena', 'Ricci', 'elena.ricci@example.com', '3330000010', '1982-06-16', 'female']
]

async function seedPatients() {
    try {
        let inserted = 0

        for (const patient of patients) {
            const result = await db.query(
                `INSERT INTO patients (
                    first_name,
                    last_name,
                    email,
                    phone,
                    birth_date,
                    gender
                )
                SELECT $1, $2, $3, $4, $5, $6
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM patients
                    WHERE email = $3::varchar
                    AND deleted_at IS NULL
                )
                RETURNING id`,
                patient
            )

            if (result.rowCount > 0) {
                inserted++
            }
        }

        console.log(`${inserted} pazienti inseriti correttamente.`)

    } catch (error) {
        console.error('Errore durante il seed:', error)
        process.exitCode = 1
    } finally {
        await db.end()
    }
}

seedPatients()
