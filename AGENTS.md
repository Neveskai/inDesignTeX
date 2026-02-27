# AGENTS.md

## Project Overview

**inDesignTeX** — A LaTeX code editor plugin for Adobe InDesign using UXP (Unified Extensibility Platform).

- **Language/Ecosystem:** JavaScript/TypeScript (Node.js)
- **License:** MIT

## Cursor Cloud specific instructions

### Repository State

This is a greenfield repository. As of the initial commit it contains only `README.md`, `LICENSE`, and `.gitignore` (Node.js template). There is no `package.json`, no source code, and no runnable application yet.

### Development Environment

- **Node.js:** v22.x is available via nvm.
- **Package managers:** npm, pnpm, and yarn are all available. No lockfile exists yet, so the project has not chosen a package manager.
- **No dependencies to install:** Until a `package.json` is added, there is nothing to install.

### Building / Running / Testing

There are no build, lint, test, or dev scripts defined. Once source code is added:

1. Check for a `package.json` and install dependencies using the matching package manager (look for lockfile).
2. Follow any scripts defined in `package.json` (e.g., `dev`, `build`, `lint`, `test`).
3. UXP plugins for InDesign require Adobe InDesign and the UXP Developer Tools CLI to load/debug — these cannot run in a headless cloud VM.

### Caveats

- Adobe UXP plugin development requires a local Adobe InDesign installation for end-to-end testing. Cloud agents can only perform linting, unit testing, and build verification — not live plugin testing in InDesign.
