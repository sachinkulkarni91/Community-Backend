const logger = require('./logger')
const jwt = require('jsonwebtoken')
const config = require('./config')
const User = require('../models/user')
const { findValidInviteByRawToken } = require('./parseInvite');



const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// Error handler to categorize and log errors

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: "Expected `username` to be unique" })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: "Invalid JSON token" })
  }

  next(error)
}

const readInviteOptional = async (req, res, next) => {
  const raw = req.cookies?.invite_token;
  if (!raw) return next();
  const invite = await findValidInviteByRawToken(raw);
  if (invite) req.invite = invite;
  next();
};

const isPublicPath = (req) => {
  const p = req.path;

  // Preflight should never be blocked
  if (req.method === 'OPTIONS') return true;

  // Auth pages
  if (p.startsWith('/auth/')) return true;

  // Invite landing
  if (p === '/community/join' && req.method === 'GET') return true;

  if (p === '/healthz' || p.startsWith('/assets/') || p.startsWith('/public/')) return true;

  return false;
};

// Extacts the jwt tokens to check if the request is valid

const tokenExtractor = (req, res, next) => {

  if (isPublicPath(req)) {
    return next();
  }

  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);
  req.token = token
  next()
}

// Extracts the user from the token for authentication
const userExtractor = async (req, res, next) => {

  if (isPublicPath(req)) {
    return next();
  }

  const token = req.token
  if (!token) return res.sendStatus(401);

  try {
    const decodedToken = jwt.verify(token, config.SECRET);

    if (!decodedToken.id) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = await User.findById(decodedToken.id)
  } catch (error) {
    return res.status(401).json({error: 'Invalid token'})
  }

  next()
}


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  readInviteOptional
}