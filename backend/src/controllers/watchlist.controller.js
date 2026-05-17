const Watchlist = require('../models/Watchlist')

async function addToWatchlist(req, res, next) {
  try {
    const { symbol, companyName } = req.body
    if (!symbol || !companyName)
      return res.status(400).json({ error: 'symbol and companyName are required' })

    const item = await Watchlist.create({
      userId: req.user.userId,
      orgId: req.user.orgId,
      symbol: symbol.toUpperCase(),
      companyName,
    })
    res.status(201).json({ item })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Already in watchlist' })
    next(err)
  }
}

async function getWatchlist(req, res, next) {
  try {
    const items = await Watchlist.find({ orgId: req.user.orgId }).sort({ addedAt: -1 })
    res.json({ items })
  } catch (err) {
    next(err)
  }
}

async function removeFromWatchlist(req, res, next) {
  try {
    const item = await Watchlist.findOneAndDelete({
      userId: req.user.userId,
      orgId: req.user.orgId,
      symbol: req.params.symbol.toUpperCase(),
    })
    if (!item) return res.status(404).json({ error: 'Item not found in watchlist' })
    res.json({ message: 'Removed from watchlist' })
  } catch (err) {
    next(err)
  }
}

module.exports = { addToWatchlist, getWatchlist, removeFromWatchlist }
