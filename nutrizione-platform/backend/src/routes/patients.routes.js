
const express = require('express')
const router = express.Router()

const authenticate = require('../middleware/auth')

const {
    listPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
} = require('../controllers/patients.controller')

router.use(authenticate)

router.get('/', listPatients)
router.post('/', createPatient)
router.get('/:id', getPatient)
router.put('/:id', updatePatient)
router.delete('/:id', deletePatient)

module.exports = router
