
const express = require('express')
const router = express.Router()

const authenticate = require('../middleware/auth')

const {
    login,
    me,
    logout
} = require('../controllers/auth.controller')

router.post('/login', login)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

module.exports = router
