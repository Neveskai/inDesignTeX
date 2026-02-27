const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { cleanupTempDir, ensureTempBaseDir } = require('../utils/cleanup');

const LATEX_TEMPLATE = String.raw`\documentclass[border=1pt,varwidth]{standalone}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{amsfonts}
\usepackage{mathtools}
\begin{document}
%LATEX_CONTENT%
\end{document}`;

const DISPLAY_MATH_PATTERNS = [
  /^\\\[/, /^\\\(/, /^\\begin\{(equation|align|gather|multline|flalign|displaymath)/,
];

function wrapLatex(latexCode) {
  const trimmed = latexCode.trim();
  const hasDocumentClass = /\\documentclass/.test(trimmed);
  if (hasDocumentClass) {
    return trimmed;
  }

  let content = trimmed;
  const isDisplayMath = DISPLAY_MATH_PATTERNS.some(p => p.test(trimmed));
  if (isDisplayMath) {
    content = `\\noindent\n${trimmed}`;
  }

  return LATEX_TEMPLATE.replace('%LATEX_CONTENT%', content);
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${stderr || error.message}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function renderLatexToEps(latexCode) {
  const baseDir = ensureTempBaseDir();
  const jobId = uuidv4();
  const workDir = path.join(baseDir, jobId);

  fs.mkdirSync(workDir, { recursive: true });

  const texFile = path.join(workDir, 'equation.tex');
  const dviFile = path.join(workDir, 'equation.dvi');
  const epsFile = path.join(workDir, 'equation.eps');

  try {
    const fullLatex = wrapLatex(latexCode);
    fs.writeFileSync(texFile, fullLatex, 'utf8');

    logger.debug(`Compiling LaTeX (job: ${jobId})...`);
    await runCommand('latex', [
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-output-directory=' + workDir,
      texFile,
    ], { cwd: workDir });

    if (!fs.existsSync(dviFile)) {
      throw new Error('LaTeX compilation did not produce a DVI file');
    }

    logger.debug(`Converting DVI to EPS (job: ${jobId})...`);
    await runCommand('dvips', [
      '-E',
      '-o', epsFile,
      dviFile,
    ], { cwd: workDir });

    if (!fs.existsSync(epsFile)) {
      throw new Error('dvips did not produce an EPS file');
    }

    const epsBuffer = fs.readFileSync(epsFile);
    logger.info(`Successfully rendered LaTeX to EPS (job: ${jobId}, size: ${epsBuffer.length} bytes)`);

    return { epsBuffer, jobId };
  } finally {
    cleanupTempDir(workDir);
  }
}

module.exports = { renderLatexToEps, wrapLatex };
