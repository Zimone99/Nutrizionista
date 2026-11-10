const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')

const {
    listAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus
} = require('../controllers/appointments.controller')

router.use(authenticate)

router.get('/', listAppointments)
router.post('/', createAppointment)
router.get('/:id', getAppointment)
router.put('/:id', updateAppointment)
router.patch('/:id/status', updateAppointmentStatus)

module.exports = router
