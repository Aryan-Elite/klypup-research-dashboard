const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'analyst'], default: 'analyst' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('User', userSchema)
