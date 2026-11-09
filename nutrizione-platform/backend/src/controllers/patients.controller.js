
const db = require('../config/database')

async function listPatients(req, res) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1)
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))
        const offset = (page - 1) * limit

        const search = String(req.query.search || '').trim()
        const status = req.query.status

        const conditions = ['deleted_at IS NULL']
        const params = []

        if (search) {
            params.push(`%${search}%`)
            conditions.push(`
                (
                    first_name ILIKE $${params.length}
                    OR last_name ILIKE $${params.length}
                    OR email ILIKE $${params.length}
                )
            `)
        }

        if (status && ['active', 'inactive'].includes(status)) {
            params.push(status)
            conditions.push(`status = $${params.length}`)
        }

        const where = conditions.join(' AND ')

        const countResult = await db.query(
            `SELECT COUNT(*)::int AS total
             FROM patients
             WHERE ${where}`,
            params
        )

        const dataParams = [...params, limit, offset]

        const result = await db.query(
            `SELECT
                id,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                phone,
                birth_date AS "birthDate",
                gender,
                status,
                created_at AS "createdAt"
             FROM patients
             WHERE ${where}
             ORDER BY created_at DESC
             LIMIT $${params.length + 1}
             OFFSET $${params.length + 2}`,
            dataParams
        )

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total: countResult.rows[0].total,
                totalPages: Math.ceil(
                    countResult.rows[0].total / limit
                )
            }
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore caricamento pazienti' })
    }
}

async function getPatient(req, res) {
    try {
        const result = await db.query(
            `SELECT
                id,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                phone,
                birth_date AS "birthDate",
                gender,
                status,
                created_at AS "createdAt"
             FROM patients
             WHERE id = $1 AND deleted_at IS NULL`,
            [req.params.id]
        )

        if (!result.rows.length) {
            return res.status(404).json({
                message: 'Paziente non trovato'
            })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore caricamento paziente' })
    }
}

async function createPatient(req, res) {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            birthDate,
            gender
        } = req.body

        if (
            typeof firstName !== 'string' ||
            typeof lastName !== 'string' ||
            !firstName.trim() ||
            !lastName.trim() ||
            firstName.length > 100 ||
            lastName.length > 100
        ) {
            return res.status(400).json({
                message: 'Nome e cognome sono obbligatori'
            })
        }

        if (email && (
            typeof email !== 'string' ||
            email.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )) {
            return res.status(400).json({
                message: 'Email non valida'
            })
        }

        const result = await db.query(
            `INSERT INTO patients (
                first_name,
                last_name,
                email,
                phone,
                birth_date,
                gender
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                phone,
                birth_date AS "birthDate",
                gender,
                status,
                created_at AS "createdAt"`,
            [
                firstName.trim(),
                lastName.trim(),
                email || null,
                phone || null,
                birthDate || null,
                gender || null
            ]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore creazione paziente' })
    }
}

async function updatePatient(req, res) {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            birthDate,
            gender,
            status
        } = req.body

        if (
            typeof firstName !== 'string' ||
            typeof lastName !== 'string' ||
            !firstName.trim() ||
            !lastName.trim() ||
            firstName.length > 100 ||
            lastName.length > 100
        ) {
            return res.status(400).json({
                message: 'Nome e cognome sono obbligatori'
            })
        }

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                message: 'Stato non valido'
            })
        }

        const result = await db.query(
            `UPDATE patients
             SET
                first_name = $1,
                last_name = $2,
                email = $3,
                phone = $4,
                birth_date = $5,
                gender = $6,
                status = $7,
                updated_at = NOW()
             WHERE id = $8 AND deleted_at IS NULL
             RETURNING
                id,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                phone,
                birth_date AS "birthDate",
                gender,
                status`,
            [
                firstName.trim(),
                lastName.trim(),
                email || null,
                phone || null,
                birthDate || null,
                gender || null,
                status,
                req.params.id
            ]
        )

        if (!result.rows.length) {
            return res.status(404).json({
                message: 'Paziente non trovato'
            })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore modifica paziente' })
    }
}

async function deletePatient(req, res) {
    try {
        const result = await db.query(
            `UPDATE patients
             SET deleted_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [req.params.id]
        )

        if (!result.rows.length) {
            return res.status(404).json({
                message: 'Paziente non trovato'
            })
        }

        res.json({ message: 'Paziente archiviato' })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore archiviazione paziente' })
    }
}

module.exports = {
    listPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
}
