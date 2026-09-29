# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: dev server with Turbopack at http://localhost:3000
- `npm run build`: production build (Turbopack)
- `npm run lint`: ESLint (flat config with `next/core-web-vitals`, `next/typescript` and `prettier`)
- `npm run typecheck`: `tsc --noEmit`
- `npm test`: Vitest + Testing Library (jsdom); tests sit next to components as `*.test.tsx`
- `npm run format` / `npm run format:check`: Prettier
- `npm run api:types`: regenerate `src/shared/api/schema.d.ts` from `../finance-server/openapi.json`

CI (`.github/workflows/ci.yml`) runs lint, typecheck, format:check, test and build.

## Architecture

This is the Next.js 15 App Router client for a family finance app ("CA$H FLOW"), built with React 19, TypeScript strict and the path alias `@/*` → `src/*`.

- **App shell:** `src/app/layout.tsx` wraps every route in `MainLayout` (`src/components/layout/`). `MainLayout` is a CSS grid with the rows header 100px / main 1fr / footer 60px. `body` is fixed to the viewport with `overflow-y: hidden`, so only `<main>` scrolls. Its `min-height: 0` is required for that and must stay.
- **Sidebar:** `Sidebar` exists but isn't used in `MainLayout` right now (the toggle was removed from the header).
- **Routes** live in `src/app/<route>/` (`home` dashboard, `transactions`, `accounts`, `categories`, `family`, `invite/[token]` for invite links, `profile`, public `login` and `register`). Components used by only one route go in that route's `components/` folder, as in `src/app/transactions/components/`. Pages wrap their content in `Page` (`src/components/layout/Page.tsx`).
- **Styling mixes several systems:**
  - Tailwind v4 via `@tailwindcss/postcss`, imported in `globals.scss`
  - plain SCSS files imported directly into their components (`_header.scss`, `_main.scss`). These are global CSS, not CSS modules, so selectors are scoped by BEM-like class names (`menu__link`) or element tags (`header`, `main`, `footer`).
  - MUI components (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`) with Emotion; the MUI theme is in `src/theme/theme.ts`, provided by `ThemeRegistry` in the root layout. Build UI with MUI; use SCSS/Tailwind only for layout.
  - `src/styles/` holds placeholder partials for variables, mixins and themes
- **API:** the server is the separate NestJS repo `finance-server` (port 3001). Call it through the typed `openapi-fetch` client in `src/shared/api/client.ts`; never edit the generated `schema.d.ts`, rerun `api:types` instead. The roadmap is `docs/PLAN.md`.
- **Data:** `useApi` in `src/shared/api/request.ts` loads data (keeps old data while reloading), `call` runs a mutation and throws `ApiError` with the server message. `src/shared/finance/` holds shared hooks (`useAccounts`, `useCategories`, `useCurrencies`, `useFamily`), types and helpers.
- **Family:** everything (accounts, categories, reports, base currency) belongs to the user's family; access rules are enforced on the server. The UI only hides actions using server-computed flags (`canTransact`/`canManage` on accounts, `canEdit` on transactions). A transfer from another member's hidden (`visibility: summary`) account arrives with `amount: null`.
- **Money:** the API sends amounts as strings of minor units (`"12345"` = 123,45 ₽). Format with `formatMoney`, parse input with `parseMoney` (no floats), and never do arithmetic on floats. Dates are `YYYY-MM-DD` strings (`src/shared/finance/dates.ts`).
- **Client-generated ids:** forms create the record id once per open (`useState(() => crypto.randomUUID())`), so a retry after a network error doesn't create a duplicate.
- **Auth:** `src/shared/auth/`. `session.ts` keeps the access token in memory and the refresh token in `localStorage`, and refreshes ahead of expiry (one request at a time, across tabs via `navigator.locks`); the `api` client middleware attaches `Authorization` and ends the session on 401. `AuthProvider` (in the root layout) exposes `useAuth()`; `AuthGate` in `MainLayout` redirects anonymous users to `/login` except on `PUBLIC_PATHS`. Pages rendered inside the gate can rely on `useAuth().user`.
- **Charts** use `recharts` (see `src/app/home/components/`, colors in `charts.ts`). Don't add another chart library. Components that use recharts or MUI interactivity need `"use client"`.
- **Custom font:** `public/fonts/PirataOne-Regular.ttf` is loaded via `@font-face` in `_header.scss`.

## Conventions

UI text and commit messages are in Russian. Commit prefixes are `feat:` and `chore:`.
