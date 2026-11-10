const db = require('../config/database')

const isValidUUID = (value) =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const isValidDate = (value) =>
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(Date.parse(value))

async function listAppointments(req, res) {
    try {
        const { from, to, status } = req.query

        if (from && !isValidDate(from)) {
            return res.status(400).json({ message: 'Data iniziale non valida' })
        }

        if (to && !isValidDate(to)) {
            return res.status(400).json({ message: 'Data finale non valida' })
        }

        if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Stato non valido' })
        }

        const conditions = ['p.deleted_at IS NULL']
        const params = []

        if (from) {
            params.push(from)
            conditions.push(`a.scheduled_at >= $${params.length}::timestamptz`)
        }

        if (to) {
            params.push(to)
            conditions.push(`a.scheduled_at <= $${params.length}::timestamptz`)
        }

        if (status) {
            params.push(status)
            conditions.push(`a.status = $${params.length}`)
        }

        const result = await db.query(
            `SELECT
                a.id,
                a.patient_id AS "patientId",
                a.scheduled_at AS "scheduledAt",
                a.status,
                a.notes,
                a.created_at AS "createdAt",
                p.first_name AS "firstName",
                p.last_name AS "lastName"
             FROM appointments a
             JOIN patients p ON p.id = a.patient_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY a.scheduled_at ASC`,
            params
        )

        res.json({ data: result.rows })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore caricamento appuntamenti' })
    }
}

async function getAppointment(req, res) {
    try {
        if (!isValidUUID(req.params.id)) {
            return res.status(400).json({ message: 'ID appuntamento non valido' })
        }

        const result = await db.query(
            `SELECT
                a.id,
                a.patient_id AS "patientId",
                a.scheduled_at AS "scheduledAt",
                a.status,
                a.notes,
                a.created_at AS "createdAt",
                p.first_name AS "firstName",
                p.last_name AS "lastName"
             FROM appointments a
             JOIN patients p ON p.id = a.patient_id
             WHERE a.id = $1 AND p.deleted_at IS NULL`,
            [req.params.id]
        )

        if (!result.rows.length) {
            return res.status(404).json({ message: 'Appuntamento non trovato' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore caricamento appuntamento' })
    }
}

async function createAppointment(req, res) {
    try {
        const { patientId, scheduledAt, notes } = req.body

        if (!isValidUUID(patientId)) {
            return res.status(400).json({ message: 'Paziente non valido' })
        }

        if (!isValidDate(scheduledAt)) {
            return res.status(400).json({ message: 'Data e ora non valide' })
        }

        if (notes != null && (typeof notes !== 'string' || notes.length > 5000)) {
            return res.status(400).json({ message: 'Note non valide (massimo 5000 caratteri)' })
        }

        const patient = await db.query(
            'SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL',
            [patientId]
        )

        if (!patient.rows.length) {
            return res.status(404).json({ message: 'Paziente non trovato' })
        }

        const result = await db.query(
            `INSERT INTO appointments (patient_id, scheduled_at, notes)
             VALUES ($1, $2, $3)
             RETURNING
                id,
                patient_id AS "patientId",
                scheduled_at AS "scheduledAt",
                status,
                notes,
                created_at AS "createdAt"`,
            [patientId, new Date(scheduledAt).toISOString(), notes?.trim() || null]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore creazione appuntamento' })
    }
}

async function updateAppointment(req, res) {
    try {
        const { patientId, scheduledAt, notes } = req.body

        if (!isValidUUID(req.params.id)) {
            return res.status(400).json({ message: 'ID appuntamento non valido' })
        }

        if (!isValidUUID(patientId)) {
            return res.status(400).json({ message: 'Paziente non valido' })
        }

        if (!isValidDate(scheduledAt)) {
            return res.status(400).json({ message: 'Data e ora non valide' })
        }

        if (notes != null && (typeof notes !== 'string' || notes.length > 5000)) {
            return res.status(400).json({ message: 'Note non valide (massimo 5000 caratteri)' })
        }

        const patient = await db.query(
            'SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL',
            [patientId]
        )

        if (!patient.rows.length) {
            return res.status(404).json({ message: 'Paziente non trovato' })
        }

        const result = await db.query(
            `UPDATE appointments
             SET patient_id = $1,
                 scheduled_at = $2,
                 notes = $3
             WHERE id = $4
             RETURNING
                id,
                patient_id AS "patientId",
                scheduled_at AS "scheduledAt",
                status,
                notes,
                created_at AS "createdAt"`,
            [
                patientId,
                new Date(scheduledAt).toISOString(),
                notes?.trim() || null,
                req.params.id
            ]
        )

        if (!result.rows.length) {
            return res.status(404).json({ message: 'Appuntamento non trovato' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore modifica appuntamento' })
    }
}

async function updateAppointmentStatus(req, res) {
    try {
        const { status } = req.body

        if (!isValidUUID(req.params.id)) {
            return res.status(400).json({ message: 'ID appuntamento non valido' })
        }

        if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Stato non valido' })
        }

        const result = await db.query(
            `UPDATE appointments
             SET status = $1
             WHERE id = $2
             RETURNING id, status`,
            [status, req.params.id]
        )

        if (!result.rows.length) {
            return res.status(404).json({ message: 'Appuntamento non trovato' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Errore modifica stato appuntamento' })
    }
}

module.exports = {
    listAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus
}
