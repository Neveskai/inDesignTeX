const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!process.env.API_KEY) {
    logger.warn('API_KEY not configured — authentication disabled');
    return next();
  }

  if (!apiKey) {
    logger.warn(`Unauthenticated request from ${req.ip}`);
    return res.status(401).json({ error: 'Missing API key. Provide X-API-Key header.' });
  }

  if (apiKey !== process.env.API_KEY) {
    logger.warn(`Invalid API key from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid API key.' });
  }

  next();
}

module.exports = { authMiddleware };
