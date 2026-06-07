# Amkor IMS — Internal Management System

Private, web-based internal management system for Amkor Travel & Tours Inc.
Covers 19 modules, 12 roles, and 3 branches (QC Main, Visa Centre, Ormoc).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Laravel | 12.x |
| Frontend | React + Inertia.js | — |
| Database | PostgreSQL | — |
| Real-time | Laravel Reverb | 1.x |
| Module structure | nwidart/laravel-modules | 13.x |
| RBAC | spatie/laravel-permission | 8.x |
| Audit trail | spatie/laravel-activitylog | 5.x |
| File attachments | spatie/laravel-medialibrary | 11.x |
| Backups | spatie/laravel-backup | 10.x |
| PDF generation | barryvdh/laravel-dompdf | 3.x |
| Excel export | maatwebsite/excel | 3.x |
| Icons | Lucide Icons (React) | — |

---

## System Requirements

Before cloning this project, your machine must have the following:

| Requirement | Version | Notes |
|---|---|---|
| PHP | **8.4.x** | 8.2 and 8.3 will fail — package minimums require 8.4 |
| Composer | 2.x | — |
| Node.js | **20.19+ or 22.12+** | Required by Vite 7 |
| npm | 9+ | — |
| PostgreSQL | 14+ | — |

---

## Run This PC

These commands are for the local Windows setup at `C:\xampp\htdocs\amkor-ims`.
Use `C:\php84\php.exe` so the project does not accidentally run with XAMPP PHP.

### 1. Check installed tools

```powershell
cd C:\xampp\htdocs\amkor-ims

C:\php84\php.exe -v
composer -V
node -v     # Must be 20.19+ or 22.12+
npm -v
C:\pgsql\bin\psql.exe --version
```

### 2. Install or refresh dependencies

```powershell
composer install
npm install
```

### 3. Create the PostgreSQL database

Run this once. If the database already exists, PostgreSQL will report that and you can continue.

```powershell
C:\pgsql\bin\psql.exe -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE amkor_ims;"
```

### 4. Prepare Laravel

```powershell
C:\php84\php.exe artisan key:generate
C:\php84\php.exe artisan migrate
C:\php84\php.exe artisan db:seed
```

### 5. Run the system

Open three PowerShell terminals.

**Terminal 1 — Laravel server**

```powershell
cd C:\xampp\htdocs\amkor-ims
C:\php84\php.exe artisan serve
```

**Terminal 2 — Vite frontend assets**

```powershell
cd C:\xampp\htdocs\amkor-ims
npm run dev
```

**Terminal 3 — Laravel Reverb WebSocket**

```powershell
cd C:\xampp\htdocs\amkor-ims
C:\php84\php.exe artisan reverb:start
```

Open:

```text
http://localhost:8000
```

Seeded login:

```text
Email: jrt@amkor.ph
Password: AmkorIMS2026!
```

### 6. Verify before committing

```powershell
npm run build
C:\php84\php.exe artisan test
```

---

## PHP Setup on Windows (Critical — Read Before Anything Else)

XAMPP's Windows installer only ships up to PHP 8.2 as of 2026. Do not use XAMPP for this project.

**Install PHP 8.4 standalone:**

1. Go to https://windows.php.net/download/
2. Download **PHP 8.4 — VS17 x64 Thread Safe — Zip** (not NTS, not x86)
3. Extract to `C:\php84`
4. Run the Composer installer from https://getcomposer.org/Composer-Setup.exe
   - Point it to `C:\php84\php.exe` when prompted
   - Let it add `C:\php84` to system PATH and remove any old PHP path (e.g. `C:\xampp\php`)
5. Open a **new** terminal and verify:

```powershell
php -v     # Must say 8.4.x
composer -v
```

**Enable required PHP extensions in `C:\php84\php.ini`:**

Open `php.ini` and uncomment these lines (remove the leading `;`):

```ini
extension=exif
extension=fileinfo
extension=gd
extension=zip
extension=pdo_pgsql
extension=pgsql
```

Verify they loaded:

```powershell
php -m | findstr -i "exif fileinfo gd zip pgsql"
```

All five must appear in the output before continuing.

---

## Installation

### 1. Clone the repository

```powershell
git clone <repo-url> amkor-ims
cd amkor-ims
```

### 2. Install PHP dependencies

```powershell
composer install
```

### 3. Install Node dependencies

```powershell
npm install
```

> **Note:** This project uses Vite 7 with `@vitejs/plugin-react@4`.
> Do NOT upgrade `@vitejs/plugin-react` to v5 or v6 — those require Vite 8,
> which conflicts with `laravel-vite-plugin` and `@tailwindcss/vite`.

### 4. Configure environment

```powershell
copy .env.example .env
php artisan key:generate
```

Edit `.env` and set your database credentials:

```env
APP_NAME="Amkor IMS"
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=amkor_ims
DB_USERNAME=your_pg_username
DB_PASSWORD=your_pg_password
```

### 5. Create the PostgreSQL database

```sql
CREATE DATABASE amkor_ims;
```

### 6. Run migrations and seeders

```powershell
php artisan migrate
php artisan db:seed
```

### 7. Publish vendor assets

```powershell
php artisan vendor:publish --provider="Nwidart\Modules\LaravelModulesServiceProvider"
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
```

### 8. Run the app

Three terminals are needed in development:

**Terminal 1 — Laravel server:**
```powershell
php artisan serve
```

**Terminal 2 — Vite (frontend assets):**
```powershell
npm run dev
```

**Terminal 3 — Reverb (real-time WebSocket):**
```powershell
php artisan reverb:start
```

Open http://localhost:8000

---

## Module Structure

All 19 modules live in `Modules/`. Each was scaffolded via:

```powershell
php artisan module:make {ModuleName}
```

| Module | Phase |
|---|---|
| Auth | 1 |
| Contacts | 2 |
| Reservation | 3 |
| Visa | 4 |
| OrmocBranch | 5 |
| AccountsReceivable | 6 |
| AccountsPayable | 7 |
| Disbursement | 7 |
| Cashbond | 8 |
| BillsMonitoring | 8 |
| CreditCardMonitoring | 8 |
| IataPayments | 8 |
| BirCompliance | 9 |
| DocumentGeneration | 9 |
| EmployeeRecords | 10 |
| Attendance | 10 |
| Marketing | 10 |
| SalesSummary | 11 |
| Notifications | 12 |

**Rules:**
- Business logic lives inside the module — never in `app/`
- Modules communicate via Laravel Events only — no direct cross-module model imports
- All shared React components live in `resources/js/Components/` — no module writes its own base UI components

---

## Architecture Rules

- No REST API by default — Inertia.js handles all page rendering
- API routes only for features that cannot be done through Inertia (e.g. live search)
- All RBAC via `spatie/laravel-permission` — no custom permission logic
- All audit logging via `spatie/laravel-activitylog` — no custom audit table
- All PDF output via `barryvdh/laravel-dompdf` using Blade templates
- All Excel exports via `maatwebsite/excel`
- No hard deletes on financial records — soft deletes only
- Lucide Icons is the only icon library — do not install others

## Phase Completion Notes

- Phase 3 Reservation & Booking is implemented as an Inertia workflow with reservation lifecycle tracking, branch scoping, financial references, and accounting-forward events.
- Phase 10 HR, Attendance, and Marketing are implemented.
- Phase 11 Sales Summary aggregates operational records from Reservation, Ormoc, Visa, and Accounts Receivable, with monthly sales targets and Excel export.
- Phase 12 Notifications provides database-backed in-app notifications, unread counts, notification center actions, and queued email delivery hooks for workflow notices.

---

## Branch & Role Structure

**Branches:** QC Main, Visa Centre, Ormoc
**Roles (12):** General Manager, COO, GSM, Accounting Officer, Disbursement Officer, Admin Auditor, HR & Admin Officer, Liaison Officer, RESA Officer, Ormoc Branch Officer, Visa Officer, Marketing Officer

Branch tagging is applied on every session. Ormoc data is always scoped separately from head office.

---

## Common Errors & Fixes

### `composer` not recognized
Composer is not in PATH. Run the Composer installer and point it to `C:\php84\php.exe`.

### `Could not find a matching version of package spatie/laravel-media-library`
Wrong package name. The correct name is `spatie/laravel-medialibrary` (no hyphen before "library").

### `ext-fileinfo / ext-exif / ext-gd / ext-zip missing`
Extensions are disabled. Open `C:\php84\php.ini`, uncomment the relevant `extension=` lines, and restart your terminal.

### `ERESOLVE unable to resolve dependency tree` on `@vitejs/plugin-react`
Do not install `@vitejs/plugin-react` v5 or v6. Install v4 explicitly:
```powershell
npm install -D @vitejs/plugin-react@4
```

### `Cannot use nwidart/laravel-modules's latest version as it requires php ^8.3`
You are on PHP 8.2. This project requires PHP 8.4. See PHP Setup section above.

### `Could not open input file: artisan`
Laravel is not installed in the current directory, or the installation is incomplete. Run `dir` to check for the `artisan` file. If missing, re-run `composer create-project laravel/laravel .` in an empty folder.

---

## Development Notes

- The `.env` file is not committed — each developer sets up their own local database
- Email service for notifications is TBD — to be confirmed with client before Phase 4
- Production hosting environment TBD — to be confirmed before Phase 14
- External accounting firm has no system login — they receive exported reports only
- Mariposa (external consolidator) has no system login — recorded in supplier directory only

---

*Based on Requirements Document v1.0 — June 2026*
