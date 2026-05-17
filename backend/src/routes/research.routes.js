const express = require('express')
const router = express.Router()
const researchController = require('../controllers/research.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.post('/query', researchController.runQuery)
router.get('/history', researchController.getHistory)
router.get('/:id', researchController.getReport)
router.put('/:id', researchController.updateReport)
router.delete('/:id', researchController.deleteReport)

module.exports = router
