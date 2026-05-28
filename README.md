# Invoxa

Desktop app for generating professional invoices, built with Tauri v2 + React + SQLite.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)

## Features

- **Invoice management** — create, edit, and delete invoices with incremental numbering (with or without prefix)
- **Client management** — full CRUD with address and tax ID
- **Supplier profile** — your company info and bank details printed on every invoice
- **Invoice templates** — pre-populate new invoices with default line items
- **PDF export** — choose where to save via native file dialog
- **Reports** — monthly and annual revenue charts and tables
- **Bilingual** — Portuguese (BR) and English interface; invoice documents always printed in English
- **Light / dark / auto theme** — follows the OS by default, overridable per user

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri v2 |
| Frontend | React 18 + TypeScript |
| UI components | Mantine v7 |
| Tables | AG Grid v33 Community |
| Charts | Recharts |
| Database | SQLite via `tauri-plugin-sql` |
| i18n | i18next + react-i18next |
| Build | Vite + Yarn |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Yarn](https://yarnpkg.com/)
- [Rust](https://rustup.rs/) (stable)
- Tauri CLI v2: `cargo install tauri-cli --version "^2"`

### Install dependencies

```bash
yarn install
```

### Run in development

```bash
yarn tauri:dev
```

### Build for production

```bash
yarn tauri:build
```

### Other scripts

```bash
yarn type-check       # TypeScript check without emitting
yarn tauri:icon       # Regenerate icons from app-icon.png
```

## Data

The SQLite database is stored at:

```
macOS: ~/Library/Application Support/com.invoxa.app/invoices.db
```

To back up your data, use **Settings → Export Database** or copy the file above manually.

## Project Structure

```
src/
├── components/        # Shared components (layout, invoice print)
├── db/                # Database access layer (one file per entity)
├── i18n/              # Translation files (en, pt-BR)
├── pages/             # Route-level page components
├── types/             # TypeScript interfaces
└── utils/             # Formatting helpers, PDF/print utilities
src-tauri/
├── migrations/        # SQL schema migrations
├── src/               # Rust entry point
└── capabilities/      # Tauri permission configuration
```

## Contributing

1. Fork the repo and create a branch from `main`
2. Install dependencies: `yarn install` (husky hooks are set up automatically)
3. Make your changes and run `yarn type-check` to verify
4. Commit using **Conventional Commits** — the `commit-msg` hook will enforce this:

   ```
   feat(scope): short description in lower-case
   fix(scope): short description in lower-case
   ```

   Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`, `build`, `perf`, `revert`

5. Open a pull request against `main`

> New UI strings must be added to both `src/i18n/locales/en.ts` and `src/i18n/locales/pt-BR.ts`.

## License

Copyright (C) 2026 Felipe Rieck

This program is free software: you can redistribute it and/or modify it under the terms of the [GNU General Public License v3.0](LICENSE) as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
