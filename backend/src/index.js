require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth.routes')
const orgRoutes = require('./routes/org.routes')
const researchRoutes = require('./routes/research.routes')
const watchlistRoutes = require('./routes/watchlist.routes')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/org', orgRoutes)
app.use('/api/research', researchRoutes)
app.use('/api/watchlist', watchlistRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/klypup')
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Backend running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
