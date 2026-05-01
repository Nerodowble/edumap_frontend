# EduMap - Frontend

Interface web do **EduMap**, plataforma de diagnóstico pedagógico para professores brasileiros. Permite enviar fotos/PDFs de provas, lançar respostas com OCR, classificar questões na taxonomia (BNCC + Bloom) e gerar relatórios por aluno, turma e conteúdo.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide Icons**.

Backend correspondente: [edumap_ia](https://github.com/Nerodowble/edumap_ia) (FastAPI + PostgreSQL).

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação no Windows (passo a passo)](#2-instalação-no-windows-passo-a-passo)
3. [Instalação em macOS / Linux](#3-instalação-em-macos--linux)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Rodando em desenvolvimento](#5-rodando-em-desenvolvimento)
6. [Build e produção](#6-build-e-produção)
7. [Estrutura do projeto](#7-estrutura-do-projeto)
8. [Solução de problemas](#8-solução-de-problemas)

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima | Para que serve |
|---|---|---|
| **Node.js** | 18.17+ (recomendado 20 LTS) | Executa o Next.js |
| **npm** | 9+ (já vem com Node) | Gerencia pacotes |
| **Git** | qualquer recente | Clonar o repositório |
| Backend EduMap rodando | - | API consumida pelo frontend (default `http://localhost:8000`) |

> Não é necessário Python nem nenhuma outra dependência nativa para rodar **só o frontend**. Tudo é JS/TS.

---

## 2. Instalação no Windows (passo a passo)

Estas instruções assumem **Windows 10/11** com PowerShell ou Prompt de Comando.

### 2.1. Instalar o Node.js

1. Acesse https://nodejs.org/ e baixe o instalador **LTS** (versão 20.x).
2. Execute o `.msi` baixado e siga o instalador (deixe marcado *"Automatically install the necessary tools"* — opcional).
3. Abra um **novo** PowerShell e confirme:

   ```powershell
   node --version
   npm --version
   ```

   Você deve ver algo como `v20.x.x` e `10.x.x`.

> Alternativa via **winget** (já vem no Windows 11):
> ```powershell
> winget install OpenJS.NodeJS.LTS
> ```

### 2.2. Instalar o Git (se ainda não tiver)

1. Baixe em https://git-scm.com/download/win e instale com as opções padrão.
2. Confirme:

   ```powershell
   git --version
   ```

### 2.3. Clonar o repositório

Abra o PowerShell na pasta onde quer colocar o projeto (ex.: `C:\Users\<seu-usuario>\dev\`):

```powershell
cd $HOME\dev
git clone https://github.com/Nerodowble/edumap_frontend.git
cd edumap_frontend
```

> Se você usa SSH com chave já cadastrada no GitHub, use:
> ```powershell
> git clone git@github.com:Nerodowble/edumap_frontend.git
> ```

### 2.4. Instalar as dependências

Dentro da pasta `edumap_frontend`:

```powershell
npm install
```

> Esse passo demora alguns minutos da primeira vez (baixa ~300MB para `node_modules`). É normal aparecer alguns *warnings* — só ignore desde que termine sem `ERR!`.

### 2.5. Configurar a variável de ambiente

Crie um arquivo chamado **`.env.local`** na raiz do projeto (mesmo nível do `package.json`) com o conteúdo:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000
```

- `NEXT_PUBLIC_API_URL` → URL da API que o **navegador** vai chamar.
- `API_URL` → URL da API usada em SSR/rewrites (server-side).

Se for consumir a API **em produção** (Render), use:

```env
NEXT_PUBLIC_API_URL=https://edumap-ia.onrender.com
API_URL=https://edumap-ia.onrender.com
```

> Já existe um `.env.local.example` no repositório que você pode copiar:
> ```powershell
> Copy-Item .env.local.example .env.local
> ```

### 2.6. Rodar em modo desenvolvimento

```powershell
npm run dev
```

Saída esperada:

```
  ▲ Next.js 14.2.x
  - Local:        http://localhost:3000
  - Environments: .env.local
```

Abra http://localhost:3000 no navegador.

> Se a porta 3000 estiver ocupada, o Next sugere outra automaticamente. Para forçar uma porta específica:
> ```powershell
> npm run dev -- -p 3001
> ```

---

## 3. Instalação em macOS / Linux

```bash
# 1. instalar node (se não tiver) — exemplos:
#    macOS:   brew install node@20
#    Ubuntu:  sudo apt install nodejs npm

# 2. clonar
git clone https://github.com/Nerodowble/edumap_frontend.git
cd edumap_frontend

# 3. dependências
npm install

# 4. env
cp .env.local.example .env.local
# edite .env.local apontando para a API

# 5. dev
npm run dev
```

---

## 4. Variáveis de ambiente

| Nome | Obrigatória | Default | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sim | `http://localhost:8000` | URL pública da API EduMap (usada no browser). Tudo prefixado com `NEXT_PUBLIC_` é exposto ao cliente. |
| `API_URL` | Não | `http://localhost:8000` | URL usada em rewrites no servidor (`next.config.mjs`). |

Não há nenhum segredo de API aqui — autenticação é feita via JWT obtido no `/auth/login` e armazenado em `localStorage`.

---

## 5. Rodando em desenvolvimento

```powershell
npm run dev      # inicia em http://localhost:3000 com hot-reload
npm run lint     # checa lint (eslint + next)
```

### Login para testar

Após subir o backend e o frontend, acesse `/register` para criar uma conta de **professor** ou use as contas de admin já cadastradas no banco do backend.

---

## 6. Build e produção

```powershell
npm run build    # build de produção em .next/
npm run start    # serve o build em http://localhost:3000
```

### Deploy na Vercel (já configurado)

O projeto já tem `vercel.json`. Basta:

1. Conectar o repositório no painel da Vercel.
2. Configurar a env `NEXT_PUBLIC_API_URL` apontando pro backend Render.
3. Deploy automático a cada push em `main`.

---

## 7. Estrutura do projeto

```
edumap_frontend/
├── public/
│   └── logo.png
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── layout.tsx          # layout raiz + ToastProvider + Inter font
│   │   ├── page.tsx            # home (saudação + atalhos)
│   │   ├── login/              # /login
│   │   ├── register/           # /register
│   │   ├── turmas/             # /turmas (CRUD turmas + alunos)
│   │   ├── analisar/           # /analisar (upload de prova)
│   │   ├── lancar/             # /lancar (lançar respostas + OCR)
│   │   ├── relatorio/          # /relatorio (relatórios e abas)
│   │   │   ├── TurmaTab.tsx
│   │   │   ├── AlunoTab.tsx
│   │   │   ├── DrilldownTab.tsx
│   │   │   └── TaxonomiaTab.tsx
│   │   ├── admin/              # /admin (taxonomia + usuários)
│   │   └── globals.css         # tailwind + classes utilitárias
│   ├── components/             # AuthGuard, Sidebar, Toast, BloomBadge, etc.
│   └── lib/                    # api.ts, auth.ts, types.ts, image.ts, constants.ts
├── next.config.mjs             # rewrites para /api/backend
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vercel.json
```

> O projeto usa **App Router** (`src/app/`). **Não existe** `src/pages/` — qualquer warning sobre `pages` pode ser ignorado.

---

## 8. Solução de problemas

### "Couldn't find any `pages` or `app` directory"
Significa que você está rodando `npm run dev` fora da pasta certa. Confira que está dentro de `edumap_frontend/` (deve ter `package.json` e `src/app/` no diretório atual).

### `npm install` falha com "ERESOLVE could not resolve"
Tente forçar:
```powershell
npm install --legacy-peer-deps
```

### Erro de execução de scripts no PowerShell
Se o PowerShell reclamar que `npm.ps1` não pode ser executado por política, abra o PowerShell como **Administrador** e rode:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "EACCES" ou "EPERM" no Windows
- Feche o VS Code, terminais e o navegador apontando pra pasta.
- Apague `node_modules\` e `.next\`:
  ```powershell
  Remove-Item -Recurse -Force node_modules, .next, package-lock.json
  npm install
  ```

### Antivírus segura `.next/`
Windows Defender / antivírus corporativos às vezes barram a escrita em `.next/`. Adicione a pasta do projeto à lista de exclusões.

### Porta 3000 ocupada
```powershell
npm run dev -- -p 3001
```

### Frontend não consegue falar com a API
- Confira que `NEXT_PUBLIC_API_URL` no `.env.local` aponta pra API correta.
- Se a API está em `localhost:8000`, garanta que o backend está rodando.
- CORS: o backend já libera `*` para desenvolvimento.
- Reinicie o `npm run dev` após mexer em `.env.local` (env só é lido na inicialização).

### Login funciona mas o app redireciona pra `/login` sempre
Significa que o token não foi salvo no `localStorage` ou a API rejeitou. Abra o DevTools → Application → Local Storage e confirme que tem `auth_token` e `auth_user`. Em modo anônimo isso pode ser bloqueado.

---

## Repositório irmão

- **Backend**: https://github.com/Nerodowble/edumap_ia

---

*Projeto desenvolvido como atividade de extensão universitária — Faculdade São Judas Tadeu.*
