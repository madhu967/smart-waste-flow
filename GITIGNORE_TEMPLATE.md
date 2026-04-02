# ===== ENVIRONMENT VARIABLES =====

# Never commit environment files with sensitive credentials

.env.local
.env.\*.local
.env
!.env.example

# ===== NODE & BUILD =====

node_modules/
dist/
build/
.next/
out/
\*.tsbuildinfo

# ===== IDE & EDITOR =====

.vscode/
.idea/
_.swp
_.swo
_~
.DS_Store
.env._.swp

# ===== LOGS =====

logs/
_.log
npm-debug.log_
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# ===== OS FILES =====

.DS_Store
Thumbs.db

# ===== TESTING =====

coverage/
.nyc_output/

# ===== VITE SPECIFIC =====

.vite/

# ===== VERCEL =====

.vercel/
.vercelignore
