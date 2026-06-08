const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
// const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy

const OpenIDConnectStrategy = require('passport-openidconnect')
const User = require('../model/User')

passport.serializeUser((user, done) => {
  done(null, user._id.toString())
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

// Google
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.development ? 'http://localhost:3000/auth/google/callback' : 'https://node-car-rent.onrender.com/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'google' })
    if (!user) {
      user = await User.create({
        name:          profile.displayName,
        email:         profile.emails[0].value,
        oauthId:       profile.id,
        oauthProvider: 'google',
        role:          'user',
        password:      'oauth-no-password'
      })
    }
    done(null, user)
  } catch (err) {
    done(err)
  }
}))

// Facebook
passport.use(new FacebookStrategy({
  clientID:     process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL:  process.env.development ? 'http://localhost:3000/auth/facebook/callback' : 'https://node-car-rent.onrender.com/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails'],
   enableProof:   true   
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'facebook' })
    if (!user) {
      user = await User.create({
        name:          profile.displayName,
        email:         profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
        oauthId:       profile.id,
        oauthProvider: 'facebook',
        role:          'user',
        password:      'oauth-no-password'
      })
    }
    done(null, user)
  } catch (err) {
    done(err)
  }
}))

passport.use('linkedin', new OpenIDConnectStrategy({
  issuer:            'https://www.linkedin.com/oauth',
  authorizationURL:  'https://www.linkedin.com/oauth/v2/authorization',
  tokenURL:          'https://www.linkedin.com/oauth/v2/accessToken',
  userInfoURL:       'https://api.linkedin.com/v2/userinfo',
  clientID:          process.env.LINKEDIN_CLIENT_ID,
  clientSecret:      process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL:       process.env.development ? 'http://localhost:3000/auth/linkedin/callback' : 'https://node-car-rent.onrender.com/auth/linkedin/callback',
  scope:             ['openid', 'profile', 'email']
}, async (issuer, profile, done) => {
  try {
    let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'linkedin' })
    if (!user) {
      user = await User.create({
        name:          profile.displayName,
        email:         profile.emails?.[0]?.value || `${profile.id}@linkedin.com`,
        oauthId:       profile.id,
        oauthProvider: 'linkedin',
        role:          'user',
        password:      'oauth-no-password'
      })
    }
    done(null, user)
  } catch (err) {
    done(err)
  }
}))

module.exports = passport