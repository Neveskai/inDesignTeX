const express = require('express');
const router = express.Router();
const { renderLatexToEps } = require('../services/texRenderer');
const logger = require('../utils/logger');

const DANGEROUS_COMMANDS = [
  '\\input', '\\include', '\\write18', '\\immediate',
  '\\openout', '\\closeout', '\\write', '\\read',
  '\\newwrite', '\\newread', '\\catcode',
  '\\csname', '\\endcsname',
  '\\def\\', '\\edef', '\\xdef', '\\gdef',
];

function sanitizeLatex(latex) {
  for (const cmd of DANGEROUS_COMMANDS) {
    if (latex.includes(cmd)) {
      throw new Error(`Forbidden LaTeX command detected: ${cmd}`);
    }
  }
  return latex;
}

router.post('/render', async (req, res) => {
  try {
    const { latex } = req.body;

    if (!latex || typeof latex !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "latex" field in request body.' });
    }

    if (latex.length > 50000) {
      return res.status(400).json({ error: 'LaTeX input too large (max 50KB).' });
    }

    const sanitized = sanitizeLatex(latex);
    const { epsBuffer, jobId } = await renderLatexToEps(sanitized);

    res.set({
      'Content-Type': 'application/postscript',
      'Content-Disposition': `attachment; filename="equation-${jobId.slice(0, 8)}.eps"`,
      'X-Job-Id': jobId,
    });

    res.send(epsBuffer);
  } catch (err) {
    logger.error('Render error:', err.message);
    const status = err.message.includes('Forbidden') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { latex } = req.body;

    if (!latex || typeof latex !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "latex" field.' });
    }

    sanitizeLatex(latex);
    res.json({ valid: true, message: 'LaTeX input passed validation.' });
  } catch (err) {
    res.json({ valid: false, message: err.message });
  }
});

module.exports = router;
