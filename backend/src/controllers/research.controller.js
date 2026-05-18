const Report = require('../models/Report')
const { runAgent } = require('../services/agent/agentLoop')

async function runQuery(req, res, next) {
  try {
    const { query } = req.body
    if (!query) return res.status(400).json({ error: 'query is required' })

    const { result, trace } = await runAgent(query)

    const title = query.length > 60 ? query.slice(0, 60) + '...' : query
    const report = await Report.create({
      userId: req.user.userId,
      orgId: req.user.orgId,
      query,
      title,
      result,
      trace,
    })

    res.status(201).json({ reportId: report._id, result, trace })
  } catch (err) {
    next(err)
  }
}

async function getHistory(req, res, next) {
  try {
    const { search, tag } = req.query
    const filter = { orgId: req.user.orgId }
    if (tag) filter.tags = tag
    if (search) filter.title = { $regex: search, $options: 'i' }

    const reports = await Report.find(filter)
      .select('title query tags createdAt trace userId')
      .sort({ createdAt: -1 })

    res.json({ reports })
  } catch (err) {
    next(err)
  }
}

async function getReport(req, res, next) {
  try {
    const report = await Report.findOne({ _id: req.params.id, orgId: req.user.orgId })
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json({ report })
  } catch (err) {
    next(err)
  }
}

async function updateReport(req, res, next) {
  try {
    const { tags, title } = req.body
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { ...(tags && { tags }), ...(title && { title }) },
      { new: true }
    )
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json({ report })
  } catch (err) {
    next(err)
  }
}

async function deleteReport(req, res, next) {
  try {
    const filter = { _id: req.params.id, orgId: req.user.orgId }
    if (req.user.role !== 'admin') filter.userId = req.user.userId
    const report = await Report.findOneAndDelete(filter)
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json({ message: 'Report deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { runQuery, getHistory, getReport, updateReport, deleteReport }
