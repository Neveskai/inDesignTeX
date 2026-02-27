const fs = require('fs');
const logger = require('./logger');

function cleanupTempDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      logger.debug(`Cleaned up temp directory: ${dirPath}`);
    }
  } catch (err) {
    logger.warn(`Failed to cleanup temp directory ${dirPath}:`, err.message);
  }
}

function ensureTempBaseDir() {
  const baseDir = process.env.TEMP_DIR || '/tmp/indesigntex';
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
}

module.exports = { cleanupTempDir, ensureTempBaseDir };
