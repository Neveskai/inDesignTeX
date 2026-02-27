# inDesignTeX

Editor de código LaTeX para InDesign usando UXP.

Renderiza equações LaTeX como arquivos EPS e insere diretamente em documentos do Adobe InDesign.

## Arquitetura

```
inDesignTeX/
├── backend/          # Servidor Express.js (TexLive Server)
│   ├── src/
│   │   ├── index.js          # Ponto de entrada do servidor
│   │   ├── routes/latex.js   # Rotas da API de renderização
│   │   ├── middleware/       # Auth (API Key) e Rate Limiting
│   │   ├── services/         # Motor de renderização LaTeX → EPS
│   │   └── utils/            # Logger e limpeza de arquivos temp
│   ├── Dockerfile
│   └── package.json
├── plugin/           # Plugin UXP para Adobe InDesign
│   ├── manifest.json         # Manifesto do plugin UXP
│   ├── index.html            # Interface do painel
│   ├── index.js              # Lógica do plugin
│   └── styles.css            # Estilos do painel
└── docker-compose.yml
```

## Pré-requisitos

- **Node.js** >= 20.0.0
- **TexLive** (texlive-base, texlive-latex-base, texlive-latex-extra, texlive-fonts-recommended)
- **dvips** e **ghostscript**
- **Adobe InDesign** >= 2023 (v18.5) com UXP Developer Tools (para o plugin)

## Início Rápido

### Backend (TexLive Server)

```bash
# Instalar dependências
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Executar em modo desenvolvimento
npm run dev

# Ou a partir da raiz do projeto:
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

### Com Docker

```bash
docker compose up --build
```

### API

#### Health Check
```
GET /api/health
```

#### Renderizar LaTeX para EPS
```
POST /api/latex/render
Content-Type: application/json
X-API-Key: sua-api-key

{
  "latex": "$E = mc^2$"
}
```

Retorna o arquivo EPS como `application/postscript`.

#### Validar LaTeX
```
POST /api/latex/validate
Content-Type: application/json
X-API-Key: sua-api-key

{
  "latex": "$E = mc^2$"
}
```

### Plugin UXP (InDesign)

1. Abra o **UXP Developer Tools** no Adobe InDesign
2. Clique em "Add Plugin" e selecione a pasta `plugin/`
3. Carregue o plugin
4. Configure o endereço do backend e a API Key no painel de configurações
5. Digite equações LaTeX e insira no documento

## Segurança

- **Autenticação** via API Key (header `X-API-Key`)
- **Rate Limiting** configurável (padrão: 100 req/15min)
- **Sanitização** de comandos LaTeX perigosos (`\input`, `\write18`, etc.)
- **Helmet** para headers HTTP seguros
- **CORS** configurável

## Testes

```bash
cd backend
npm test
```

## Lint

```bash
cd backend
npm run lint
```

## Licença

MIT © Wendell Neves
