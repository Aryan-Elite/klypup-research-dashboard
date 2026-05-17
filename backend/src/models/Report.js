const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
  query: { type: String, required: true },
  title: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  tags: { type: [String], default: [] },
  trace: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Report', reportSchema)
