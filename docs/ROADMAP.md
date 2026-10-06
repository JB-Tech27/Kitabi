# Kitabi - Technical & UI/UX Roadmap

## 1. Security (priority: high)

Based on the official Electron security checklist:

- Validate the sender of every IPC message in the main process (`event.senderFrame.url`).
- Add a strict Content-Security-Policy (`script-src 'self'`) in `index.html` and via session headers.
- Block navigation and new windows: `webContents.setWindowOpenHandler(() => ({ action: 'deny' }))` and `will-navigate`.
- Enable `sandbox: true` in `webPreferences`.
- Never pass untrusted URLs to `shell.openExternal`.
- Avoid `file://` for packaged content: serve the UI through a custom protocol (`protocol.handle`).
- Review Electron Fuses (disable `RunAsNode`, enable ASAR integrity) before distribution.
- Keep Electron up to date.
- Validate all IPC payloads with a schema library (e.g. Zod) before touching the database.

## 2. Database & architecture

- Add a migrations system using `PRAGMA user_version` (numbered SQL files) instead of `CREATE TABLE IF NOT EXISTS` only.
- Split `db.js` into repositories: `books.repo.js`, `members.repo.js`, `loans.repo.js`.
- Wrap multi-step operations (loan + stock check) in `db.transaction()` to prevent race conditions.
- Add indexes: `books(title)`, `books(isbn)` UNIQUE (nullable), `loans(book_id, return_date)`, `loans(member_id)`.
- Add tables: `categories`, `settings` (loan duration, fine per day), `fines`, `audit_log`.
- Keep WAL mode; add automatic backup using `db.backup()` (daily + before every migration) and a manual Export/Import backup button.
- Pagination (LIMIT/OFFSET or keyset) for books and loans lists; use SQLite FTS5 for fast full-text search (Arabic-friendly with `unicode61` tokenizer).
- Move the renderer to TypeScript; share IPC types between main and renderer.
- Add a state/data layer in the renderer (TanStack Query) for caching and invalidation instead of manual `load()` calls.
- Tests: Vitest for repositories (in-memory SQLite), Playwright for end-to-end flows.
- CI: GitHub Actions to build Windows (NSIS) and Linux (AppImage) on tags; use electron-builder + auto-update (electron-updater) with code signing.

## 3. Features

1. Barcode / ISBN scanner input (USB scanners behave as keyboards) and quick-loan by scanning a member card then a book.
2. Fines for overdue loans and a member status (active / suspended).
3. Loan renewal and reservations queue.
4. Member card and book label printing (PDF with barcode).
5. Reports: most borrowed books, overdue list, monthly activity; export to PDF / Excel / CSV.
6. Import books from CSV / Excel; fetch metadata and cover from Open Library API by ISBN.
7. Roles & login (admin / librarian) with hashed passwords (argon2 / bcrypt) and an audit log.
8. Multi-language (Arabic / French / English) with i18n and RTL/LTR switching.

## 4. UI/UX design

- Design tokens: define the full colour scale, radius, spacing and shadows in Tailwind v4 `@theme`; add a light theme and a theme toggle (persisted in settings).
- Arabic typography: bundle a local font (e.g. Cairo or Tajawal) - no CDN, the app must work offline.
- Command palette (Ctrl+K) for global search across books, members and loans.
- Keyboard shortcuts: Ctrl+N new item, Ctrl+F focus search, Esc close dialogs, Enter submit.
- Replace `alert()` / `confirm()` with toast notifications and confirmation dialogs (undo for delete when possible).
- Table improvements: sortable columns, sticky header, column filters, row selection with bulk actions, skeleton loading states, and meaningful empty states with a call-to-action.
- Dashboard: charts (loans per month, top categories), an overdue alert panel, quick actions (New loan, Return by scan).
- Loan form: searchable combobox for books and members instead of plain `<select>`; show member's active loans and the due date quick presets (7 / 14 / 30 days).
- Book cards view (cover grid) in addition to the table, with availability badge.
- Motion: keep Framer Motion durations at 150-250ms, use `layout` animations only for lists, honour `prefers-reduced-motion` with `MotionConfig reducedMotion="user"`.
- Accessibility: focus trap and `aria-modal` in dialogs, visible focus rings, colour contrast AA, labels for all inputs, keyboard-reachable actions.
- Window UX: custom title bar (frameless) with window controls, remember window size/position, native menu with shortcuts.

## 5. Suggested order

1. Security hardening + validation + transactions + migrations.
2. Toasts / dialogs / combobox / pagination / FTS search.
3. Backup & restore, settings, fines.
4. Reports, barcode, import/export.
5. Roles, i18n, CI release pipeline with code signing and auto-update.
