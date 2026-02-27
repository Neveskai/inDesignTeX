# AGENTS.md

## Project Overview

**inDesignTeX** — A LaTeX code editor plugin for Adobe InDesign using UXP (Unified Extensibility Platform). Renders LaTeX equations as EPS files and inserts them directly into InDesign documents.

### Architecture

- **`backend/`** — Express.js server (TexLive Server) that converts LaTeX to EPS via `latex` + `dvips`
- **`plugin/`** — UXP panel plugin for Adobe InDesign (vanilla JS, no build step)
- **`docker-compose.yml`** — Production deployment config

## Cursor Cloud specific instructions

### Running the Backend

```bash
cd backend && npm run dev
```

The server runs on `http://localhost:3000`. Use the dev API key from `backend/.env` for testing: `dev-api-key-indesigntex-2026`.

### Key API Endpoints

- `GET /api/health` — no auth required
- `POST /api/latex/render` — requires `X-API-Key` header, returns EPS binary
- `POST /api/latex/validate` — requires `X-API-Key` header, returns JSON

### System Dependencies

The backend requires TexLive packages installed on the host:
- `texlive-base`, `texlive-latex-base`, `texlive-latex-extra`, `texlive-fonts-recommended`
- `dvipng`, `ghostscript`

These are NOT managed by `npm install`. If `latex` or `dvips` are missing, install them:
```bash
sudo apt-get install -y texlive-base texlive-latex-base texlive-fonts-recommended texlive-latex-extra dvipng ghostscript
```

### Lint / Test / Build

Standard commands from the repo root (see `package.json` scripts):
- **Lint:** `npm run lint`
- **Test:** `npm test`
- **Dev server:** `npm run dev`

### Caveats

- The `standalone` document class with `varwidth` option is used for wrapping bare LaTeX equations. Display math (`\[...\]`) requires `\noindent` prefix — this is handled automatically by the renderer.
- The UXP plugin (`plugin/`) has no build step — it's pure HTML/CSS/JS loaded directly by InDesign's UXP Developer Tools. It cannot be tested in a headless environment; it requires Adobe InDesign >= v18.5.
- The `plugin/icons/icon-24.png` is a placeholder — replace with a real 24x24 PNG icon before distribution.
