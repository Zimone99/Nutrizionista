const pool = require('../config/database')

// Elenco visite di un paziente
const getPatientVisits = async (req, res) => {
  try {
    const { patientId } = req.params

    const result = await pool.query(
      `SELECT *
       FROM visits
       WHERE patient_id = $1
       ORDER BY visit_date DESC`,
      [patientId]
    )

    res.json({ data: result.rows })
  } catch (error) {
    console.error('Errore recupero visite:', error)
    res.status(500).json({ message: 'Errore nel recupero delle visite' })
  }
}

// Dettaglio visita
const getVisit = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM visits
       WHERE id = $1`,
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Visita non trovata' })
    }

    res.json({ data: result.rows[0] })
  } catch (error) {
    console.error('Errore recupero visita:', error)
    res.status(500).json({ message: 'Errore nel recupero della visita' })
  }
}

// Creazione visita
const createVisit = async (req, res) => {
  try {
    const { patientId, visitDate, weight, height, notes } = req.body

    if (!patientId) {
      return res.status(400).json({ message: 'Paziente obbligatorio' })
    }

    if (weight !== undefined && weight !== null && Number(weight) <= 0) {
      return res.status(400).json({ message: 'Peso non valido' })
    }

    if (height !== undefined && height !== null && Number(height) <= 0) {
      return res.status(400).json({ message: 'Altezza non valida' })
    }

    const patient = await pool.query(
      `SELECT id FROM patients
       WHERE id = $1 AND deleted_at IS NULL`,
      [patientId]
    )

    if (patient.rows.length === 0) {
      return res.status(404).json({ message: 'Paziente non trovato' })
    }

    const result = await pool.query(
      `INSERT INTO visits
       (patient_id, visit_date, weight, height, notes)
       VALUES ($1, COALESCE($2, NOW()), $3, $4, $5)
       RETURNING *`,
      [patientId, visitDate || null, weight ?? null, height ?? null, notes || null]
    )

    res.status(201).json({
      message: 'Visita creata correttamente',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Errore creazione visita:', error)
    res.status(500).json({ message: 'Errore nella creazione della visita' })
  }
}

// Modifica visita
const updateVisit = async (req, res) => {
  try {
    const { visitDate, weight, height, notes } = req.body

    const result = await pool.query(
      `UPDATE visits
       SET visit_date = COALESCE($1, visit_date),
           weight = $2,
           height = $3,
           notes = $4
       WHERE id = $5
       RETURNING *`,
      [visitDate || null, weight ?? null, height ?? null, notes ?? null, req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Visita non trovata' })
    }

    res.json({
      message: 'Visita aggiornata correttamente',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Errore modifica visita:', error)
    res.status(500).json({ message: 'Errore nella modifica della visita' })
  }
}

// Eliminazione visita
const deleteVisit = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM visits
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Visita non trovata' })
    }

    res.json({ message: 'Visita eliminata correttamente' })
  } catch (error) {
    console.error('Errore eliminazione visita:', error)
    res.status(500).json({ message: 'Errore nell’eliminazione della visita' })
  }
}

module.exports = {
  getPatientVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit
}
