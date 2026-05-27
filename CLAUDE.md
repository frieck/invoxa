# CLAUDE.md — Invoxa

Instructions for Claude Code when working in this repository.

---

## Rules that override all defaults

- **Never commit or push without explicit confirmation.** Always stage, show a summary of what will change, and ask before running `git commit` or `git push`.
- **Never install packages without confirming first.** Show the package name and reason, then wait for approval.

---

## Project overview

**Invoxa** is a Tauri v2 desktop app for invoice generation targeting Brazilian freelancers.
- Frontend: React 18 + TypeScript, Mantine v7, AG Grid v33, Recharts
- Backend: SQLite via `tauri-plugin-sql` with migrations
- i18n: pt-BR (default) and English; **invoice print documents are always in English**
- Theme: light/dark/auto following OS default, persisted in localStorage

---

## Running the app

```bash
yarn tauri:dev       # development (hot reload)
yarn tauri:build     # production build
yarn type-check      # TypeScript check only
yarn tauri:icon      # regenerate icons from app-icon.png
```

---

## Architecture

### Database
- All DB access lives in `src/db/` — one file per entity (`invoices.ts`, `clients.ts`, etc.)
- Schema and migrations in `src-tauri/migrations/001_initial.sql`
- New tables or columns → add a new migration file (`002_*.sql`) and register it in `src-tauri/src/lib.rs`
- Never alter `001_initial.sql` directly after first run

### Pages & components
- Route-level pages in `src/pages/`
- Shared components in `src/components/`
- `InvoicePrint.tsx` uses **100% inline styles** — no Mantine components inside. This is intentional to prevent dark theme CSS from bleeding into the print document.

### i18n
- Translation files: `src/i18n/locales/en.ts` and `src/i18n/locales/pt-BR.ts`
- Both files must stay in sync — add keys to both when adding UI text
- Inside `InvoicePrint.tsx` always use `i18n.getFixedT('en')` regardless of app language

### Types
- All shared interfaces in `src/types/index.ts`
- Invoice queries JOIN client address fields — keep `Invoice` interface and SQL queries in sync

---

## Code conventions

- **No comments** unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant)
- **No extra abstractions** beyond what the task requires
- Inline styles in `InvoicePrint.tsx` must have explicit `as React.CSSProperties` types
- Use `light-dark()` CSS function for theme-aware colors in layout components, not hardcoded hex values
- Currency formatting goes through `formatCurrency()` in `src/utils/format.ts`

---

## Data location

```
macOS (dev + prod): ~/Library/Application Support/com.invoxa.app/invoices.db
```

---

## What to avoid

- Don't use Mantine `<Table>` or any Mantine component inside `InvoicePrint.tsx`
- Don't use `window.open()` for print — Tauri blocks it. Use the overlay approach in `src/utils/pdf.ts`
- Don't hardcode English strings in UI components — always use `t('...')` from `useTranslation()`
- Don't add error handling for scenarios that can't happen; trust SQLite constraints and Tauri plugin guarantees
