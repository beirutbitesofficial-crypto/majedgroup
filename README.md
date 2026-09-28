# Majed Group — مجموعة ماجد

Project management, pricing and accounting for an aluminum and metalworks (ألمنيوم وحدادة) workshop. It is built as a **React web app** (Vite + React 19 + React Router). The UI is Arabic (RTL) or English, with dark and light themes, and works on phones and desktops.

## Run locally
```bash
npm install
npm run dev      # development server
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Deploy on Hostinger

### Option A: Node.js Web App (hPanel → Websites → Add website → Node.js app → import from GitHub)
| Setting | Value |
|---|---|
| Repository | `beirutbitesofficial-crypto/majedgroup` |
| Branch | `claude/project-management-system-dg3cxo` (or `main` after merging) |
| Framework preset | **Vite** (React) |
| Node.js version | **22.x** (20.19 or newer) |
| Root directory | `./` |
| Package manager | `npm` |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | none |

### Option B: plain Git deployment (hPanel → Advanced → GIT)
The GitHub Action in `.github/workflows/build-deploy-branch.yml` builds the app on every push and publishes the ready files to the **`deploy`** branch.
| Setting | Value |
|---|---|
| Repository | `https://github.com/beirutbitesofficial-crypto/majedgroup.git` |
| Branch | `deploy` |
| Directory | empty (→ `public_html`) or a sub-folder such as `system` |

For automatic updates, copy the **Webhook URL** from hPanel and add it in GitHub under **Settings → Webhooks**.

### Option C: manual upload
Run `npm run build`, then upload everything inside `dist/` into `public_html` with File Manager.

Asset paths are relative (`base: './'`) and routes use `#/`, so the app works from the domain root or from any sub-folder without rewrite rules. `public/.htaccess` forces HTTPS.

## Features
- **Projects & pricing**: aluminum (sliding, casement, fixed, door) and metalworks (gate, steel door, railing, window guard, pergola). Prices are calculated from profiles in kg/m, finishes, glass, sheet, labor and paint. Each item gets an automatic technical drawing, cut lists are nested onto stock bars, and quotations can be printed or saved as PDF.
- **Sketch pad** with automatic measurements.
- **Users & roles**: admin, accountant, sales, worker, with an audit log.
- **Quick entry** for materials, wages, fuel, rent, generator and more. Amounts can be entered in USD or LBP, and fixed monthly costs come with reminders.
- **Customers**: paid in full, partly paid, not paid and overdue, with statements, receipts and WhatsApp reminders.
- **Suppliers** (credit purchases) and **workers** (wages and advances).
- **Double-entry accounting**: journal, general ledger, trial balance, income statement, balance sheet and period lock.
- **Monthly and yearly reports** with CSV export.

Data is stored in the browser (localStorage key `mg.db`, the same key the earlier version used). Use **Settings → Export data** for backups.

## Code layout
```
src/lib/        domain logic (pricing, drawings, ledger, auth, i18n, data store) — no UI
src/components/ shared React UI (shell, modals, tables, charts)
src/forms/      modal forms (project, item editor, money, people)
src/pages/      one component per screen
```
