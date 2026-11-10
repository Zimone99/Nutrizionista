const express = require('express')
const router = express.Router()

const authenticate = require('../middleware/auth')

const {
  getPatientVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit
} = require('../controllers/visits.controller')

router.use(authenticate)

router.get('/patient/:patientId', getPatientVisits)
router.get('/:id', getVisit)
router.post('/', createVisit)
router.put('/:id', updateVisit)
router.delete('/:id', deleteVisit)

module.exports = router
