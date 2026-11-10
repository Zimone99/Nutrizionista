
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

const app = express()

app.use(helmet())

app.use(cors({
    origin: 'https://nutrizionista-r3yh.onrender.com',
    credentials: true
}))

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

api.post('/api/auth/login', {
    email,
    password
})

app.use('/api/auth', require('./routes/auth.routes'))

app.use('/api/dashboard',
    require('./routes/dashboard.routes')
)

app.use('/api/patients',
    require('./routes/patients.routes')
)

app.use('/api/appointments',
    require('./routes/appointments.routes')
)

app.use('/api/visits', require('./routes/visits.routes'))

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Backend Nutrizionista online',
        timestamp: new Date().toISOString()
    })
})

app.use('/api/appointments',
    require('./routes/appointments.routes')
)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`)
})
