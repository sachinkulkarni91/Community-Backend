// controllers/health.js
const healthRouter = require('express').Router();
const mongoose = require('mongoose');
const config = require('../utils/config')

const startedAt = Date.now();

function baseInfo(ok) {
  return {
    ok,
    service: process.env.SERVICE_NAME || 'community-backend',
    env: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || 'unknown',   // set from CI if you want
    uptimeSec: Math.round(process.uptime()),
    startedAt: new Date(startedAt).toISOString(),
    timestamp: new Date().toISOString(),
  };
}

// Liveness: no external dependencies (fast, safe for frequent pings)
healthRouter.get('/healthz', (_req, res) => {
  res.status(200).json(baseInfo(true));
});

// HEAD variant (saves bytes for uptime monitors)
healthRouter.head('/healthz', (_req, res) => {
  res.status(200).end();
});

// Readiness: checks Mongo connection. If not ready, return 503.
healthRouter.get('/readyz', async (_req, res) => {
  const info = baseInfo(true);

  // quick state check first
  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  info.mongo = { state };

  // If connected, try a fast ping with a tight timeout
  try {
    if (state === 1 && mongoose.connection.db) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000); // 1s guard

      // admin().ping uses the underlying driver; wrap to respect timeout
      await mongoose.connection.db.admin().ping();
      clearTimeout(timeout);
      info.mongo.ping = 'ok';
      return res.status(200).json(info);
    }
    info.ok = false;
    info.reason = 'mongo-not-connected';
    return res.status(503).json(info);
  } catch (err) {
    info.ok = false;
    info.reason = 'mongo-ping-failed';
    info.error = (err && err.message) || String(err);
    return res.status(503).json(info);
  }
});

// Optional: a super-light 204 endpoint for keep-alive pings
healthRouter.get('/ping', (_req, res) => res.status(204).end());

module.exports = healthRouter;
