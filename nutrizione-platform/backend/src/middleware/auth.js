
const jwt = require('jsonwebtoken')

function authenticate(req, res, next) {
    const token = req.cookies?.session

    if (!token) {
        return res.status(401).json({
            message: 'Autenticazione richiesta'
        })
    }

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        )

        if (payload.role !== 'master') {
            return res.status(403).json({
                message: 'Accesso non autorizzato'
            })
        }

        req.user = {
            id: payload.sub,
            role: payload.role
        }

        next()
    } catch {
        return res.status(401).json({
            message: 'Sessione non valida'
        })
    }
}

module.exports = authenticate
