
const db = require('../config/database')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

async function login(req, res) {
    try {
        const { email, password } = req.body

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email e password obbligatorie'
            })
        }

        const result = await db.query(
            `SELECT id, email, password_hash, role
             FROM administrators
             WHERE LOWER(email) = LOWER($1)`,
            [email.trim()]
        )

        if (!result.rows.length) {
            return res.status(401).json({
                message: 'Credenziali non valide'
            })
        }

        const admin = result.rows[0]

        const validPassword = await bcrypt.compare(
            password,
            admin.password_hash
        )

        if (!validPassword || admin.role !== 'master') {
            return res.status(401).json({
                message: 'Credenziali non valide'
            })
        }

        const token = jwt.sign(
            {
                role: 'master'
            },
            process.env.JWT_SECRET,
            {
                subject: String(admin.id),
                expiresIn: '8h',
                algorithm: 'HS256'
            }
        )

        res.cookie('session', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 8 * 60 * 60 * 1000,
            path: '/'
        })

        res.json({
            message: 'Login effettuato',
            user: {
                id: admin.id,
                email: admin.email,
                role: admin.role
            }
        })

    } catch (error) {
        console.error('LOGIN ERROR COMPLETO:', error)
        console.error('STACK:', error.stack)

        res.status(500).json({
            message: 'Errore durante il login'
        })
    }
}

async function me(req, res) {
    try {
        const result = await db.query(
            `SELECT id, email, role
             FROM administrators
             WHERE id = $1`,
            [req.user.id]
        )

        if (!result.rows.length) {
            return res.status(401).json({
                message: 'Account non trovato'
            })
        }

        res.json({ user: result.rows[0] })

    } catch (error) {
        res.status(500).json({
            message: 'Errore verifica sessione'
        })
    }
}

function logout(req, res) {
    res.clearCookie('session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
})

    res.json({ message: 'Logout effettuato' })
}

module.exports = {
    login,
    me,
    logout
}
