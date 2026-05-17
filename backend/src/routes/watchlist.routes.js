const express = require('express')
const router = express.Router()
const watchlistController = require('../controllers/watchlist.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.post('/', watchlistController.addToWatchlist)
router.get('/', watchlistController.getWatchlist)
router.delete('/:symbol', watchlistController.removeFromWatchlist)

module.exports = router
