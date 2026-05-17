const express = require('express')
const router = express.Router()
const orgController = require('../controllers/org.controller')
const authMiddleware = require('../middleware/auth.middleware')
const requireRole = require('../middleware/rbac.middleware')

router.post('/create', authMiddleware, orgController.createOrg)
router.post('/join', orgController.joinOrg)
router.get('/me', authMiddleware, orgController.getOrgDetails)
router.get('/members', authMiddleware, orgController.getMembers)

module.exports = router
