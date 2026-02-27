require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const { authMiddleware } = require('./middleware/auth');
const { createRateLimiter } = require('./middleware/rateLimit');
const latexRoutes = require('./routes/latex');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS || '*';
app.use(cors({
  origin: corsOrigins === '*' ? '*' : corsOrigins.split(',').map(o => o.trim()),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(createRateLimiter());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inDesignTeX Backend', version: '1.0.0' });
});

app.use('/api/latex', authMiddleware, latexRoutes);

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  logger.info(`inDesignTeX Backend running on http://${HOST}:${PORT}`);
  logger.info(`Health check: http://${HOST}:${PORT}/api/health`);
});

module.exports = app;
