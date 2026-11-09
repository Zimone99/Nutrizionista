
const db = require('../config/database')

async function getDashboard(req, res) {
    try {
        const statsQuery = await db.query(`
            SELECT
                COUNT(*)::int AS total_patients,

                COUNT(*) FILTER (
                    WHERE status = 'active'
                )::int AS active_patients,

                COUNT(*) FILTER (
                    WHERE created_at >= date_trunc('month', CURRENT_DATE)
                    AND created_at < date_trunc('month', CURRENT_DATE)
                        + INTERVAL '1 month'
                )::int AS new_patients

            FROM patients
            WHERE deleted_at IS NULL
        `)

        const visitsQuery = await db.query(`
            SELECT COUNT(*)::int AS monthly_visits
            FROM visits
            WHERE visit_date >= date_trunc('month', CURRENT_DATE)
              AND visit_date < date_trunc('month', CURRENT_DATE)
                  + INTERVAL '1 month'
        `)

        const patientsQuery = await db.query(`
            SELECT
                id,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                status,
                created_at AS "createdAt"

            FROM patients
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 5
        `)

        const appointmentsQuery = await db.query(`
            SELECT
                a.id,
                a.scheduled_at AS date,
                p.first_name || ' ' || p.last_name
                    AS "patientName",
                to_char(a.scheduled_at, 'HH24:MI') AS time

            FROM appointments a

            JOIN patients p
                ON p.id = a.patient_id

            WHERE a.scheduled_at >= NOW()
              AND a.status = 'scheduled'
              AND p.deleted_at IS NULL

            ORDER BY a.scheduled_at ASC
            LIMIT 5
        `)

        const chartQuery = await db.query(`
            SELECT
                TO_CHAR(months.month, 'Mon') AS label,
                COUNT(p.id)::int AS value

            FROM generate_series(
                date_trunc('month', CURRENT_DATE)
                    - INTERVAL '5 months',
                date_trunc('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) AS months(month)

            LEFT JOIN patients p
                ON p.created_at >= months.month
                AND p.created_at < months.month + INTERVAL '1 month'
                AND p.deleted_at IS NULL

            GROUP BY months.month
            ORDER BY months.month
        `)

        res.json({
            stats: {
                totalPatients: statsQuery.rows[0].total_patients,
                activePatients: statsQuery.rows[0].active_patients,
                monthlyVisits: visitsQuery.rows[0].monthly_visits,
                newPatients: statsQuery.rows[0].new_patients
            },

            recentPatients: patientsQuery.rows,

            upcomingAppointments: appointmentsQuery.rows,

            chart: {
                labels: chartQuery.rows.map(row => row.label),
                values: chartQuery.rows.map(row => row.value)
            }
        })

    } catch (error) {
        console.error('Dashboard error:', error.message)

        res.status(500).json({
            message: 'Errore nel caricamento della dashboard'
        })
    }
}

module.exports = { getDashboard }
