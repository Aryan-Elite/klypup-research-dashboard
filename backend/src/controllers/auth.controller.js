const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Org = require('../models/Org')
const crypto = require('crypto')

function generateToken(user) {
  return jwt.sign(
    { userId: user._id, orgId: user.orgId, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

async function signup(req, res, next) {
  try {
    const { email, password, orgName } = req.body
    if (!email || !password || !orgName)
      return res.status(400).json({ error: 'email, password and orgName are required' })

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const org = await Org.create({ name: orgName, inviteCode })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash, role: 'admin', orgId: org._id })

    res.status(201).json({ token: generateToken(user), user: { email: user.email, role: user.role }, org: { name: org.name, inviteCode: org.inviteCode } })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const org = await Org.findById(user.orgId)
    res.json({ token: generateToken(user), user: { email: user.email, role: user.role }, org: { name: org.name, inviteCode: org.inviteCode } })
  } catch (err) {
    next(err)
  }
}

module.exports = { signup, login }
