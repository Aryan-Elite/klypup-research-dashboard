const Org = require('../models/Org')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function createOrg(req, res, next) {
  try {
    const org = await Org.findById(req.user.orgId)
    res.json({ org })
  } catch (err) {
    next(err)
  }
}

async function joinOrg(req, res, next) {
  try {
    const { inviteCode, email, password } = req.body
    if (!inviteCode || !email || !password)
      return res.status(400).json({ error: 'inviteCode, email and password are required' })

    const org = await Org.findOne({ inviteCode: inviteCode.toUpperCase() })
    if (!org) return res.status(404).json({ error: 'Invalid invite code' })

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash, role: 'analyst', orgId: org._id })

    const token = jwt.sign(
      { userId: user._id, orgId: user.orgId, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user: { email: user.email, role: user.role }, org: { name: org.name, inviteCode: org.inviteCode } })
  } catch (err) {
    next(err)
  }
}

async function getOrgDetails(req, res, next) {
  try {
    const org = await Org.findById(req.user.orgId)
    if (!org) return res.status(404).json({ error: 'Org not found' })
    res.json({ org })
  } catch (err) {
    next(err)
  }
}

async function getMembers(req, res, next) {
  try {
    const members = await User.find({ orgId: req.user.orgId })
      .select('-passwordHash')
      .sort({ createdAt: 1 })
    res.json({ members })
  } catch (err) {
    next(err)
  }
}

module.exports = { createOrg, joinOrg, getOrgDetails, getMembers }
