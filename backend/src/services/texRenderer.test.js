const { describe, it } = require('node:test');
const assert = require('node:assert');
const { wrapLatex, renderLatexToEps } = require('./texRenderer');

describe('wrapLatex', () => {
  it('should wrap bare equation in standalone document', () => {
    const input = '$E = mc^2$';
    const result = wrapLatex(input);
    assert.ok(result.includes('\\documentclass'));
    assert.ok(result.includes('$E = mc^2$'));
    assert.ok(result.includes('\\usepackage{amsmath}'));
  });

  it('should not wrap a full document', () => {
    const input = '\\documentclass{article}\n\\begin{document}\nHello\n\\end{document}';
    const result = wrapLatex(input);
    assert.strictEqual(result, input);
  });
});

describe('renderLatexToEps', () => {
  it('should render a simple equation to EPS', async () => {
    const result = await renderLatexToEps('$E = mc^2$');
    assert.ok(result.epsBuffer);
    assert.ok(result.epsBuffer.length > 0);
    assert.ok(result.jobId);
    const header = result.epsBuffer.toString('utf8', 0, 100);
    assert.ok(header.includes('%!PS'), 'EPS should start with PostScript header');
  });

  it('should render display math equation', async () => {
    const result = await renderLatexToEps('\\[ \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2} \\]');
    assert.ok(result.epsBuffer.length > 0);
  });

  it('should reject invalid LaTeX', async () => {
    await assert.rejects(
      () => renderLatexToEps('\\begin{invalid_env}'),
      /failed/
    );
  });
});
