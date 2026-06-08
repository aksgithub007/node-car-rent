const express  = require('express')
const router   = express.Router()
const passport = require('../util/passport')

// Google
router.get('/google',          passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/admin/signin' }),
  (req, res) => {
    req.session.isLoggedIn = true
    req.session.user = {
      _id:   req.user._id.toString(),
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role
    }
    req.session.save(() => res.redirect('/'))
  }
)

// // Facebook
router.get('/facebook',          passport.authenticate('facebook', { scope: ['email'] }))
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/admin/signin' }),
  (req, res) => {
    req.session.isLoggedIn = true
    req.session.user = {
      _id:   req.user._id.toString(),
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role
    }
    req.session.save(() => res.redirect('/'))
  }
)

// // LinkedIn
router.get('/linkedin',
  passport.authenticate('linkedin', { scope: ['openid', 'profile', 'email'] })
)

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/admin/signin' }),
  (req, res) => {
    req.session.isLoggedIn = true
    req.session.user = {
      _id:   req.user._id.toString(),
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role
    }
    req.session.save((err) => {
      if (err) return res.redirect('/admin/signin')
      res.redirect('/')
    })
  }
)

module.exports = router