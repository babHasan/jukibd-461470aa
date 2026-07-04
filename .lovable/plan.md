# Laravel + MySQL Port — Delivered as a Downloadable Package

## Important context

Lovable only builds and runs React/Vite/TypeScript apps in this workspace. I cannot run PHP, Composer, `artisan`, or MySQL here, and I cannot replace the current React app in the preview with a Laravel one. What I *can* do is **generate a complete Laravel 11 project as source code and hand it to you as a downloadable ZIP** under `/mnt/documents/`, together with a MySQL schema + seed dump. You then run it locally (or on your own server) with `composer install` + `php artisan serve`.

The current React app in this Lovable project will stay untouched.

## What you'll get in the ZIP

```text
jukibd-laravel/
├── app/
│   ├── Models/               Eloquent models for every table
│   ├── Http/Controllers/     Web + API controllers per module
│   ├── Http/Middleware/      Role/permission gates (mirrors has_role RPC)
│   └── Services/
│       ├── SmsService.php    BulkSMSBD sender (port of send-sms edge fn)
│       └── BulkSmsService.php
├── database/
│   ├── migrations/           One migration per current table
│   └── seeders/              Reference data (brands, categories, roles)
├── routes/
│   ├── web.php               Auth + admin pages
│   └── api.php               Customer portal + track endpoints
├── resources/views/          Blade templates (login, dashboard, jobs,
│                             invoice/print, customer portal, admin)
├── public/                   Entry point + assets
├── config/                   DB, mail, sms, auth config
├── .env.example              MYSQL_*, BULKSMSBD_*, APP_URL
├── composer.json
├── README.md                 Local setup steps
└── mysql-schema.sql          Full MySQL DDL + seed data dump
```

## Modules that will be ported

Auth (mobile-login, role/permission gates) · Jobs (JOB- prefix, status flow, notes, parts) · Customers/Clients · Branches · Brands/Models/Boards · Inventory · Warranties · Invoices/Print · Customer Portal (`/track`) · Challan Verify · Company Info + Appearance + Footer · SMS Templates + Bulk SMS + logs · Cashbook (Cash In/Out, Balance Sheet) · Expenses/Income + categories · Chart of Accounts · Customer Ledger · Reports (Company/User/Collection/Expense/Transaction) · Analytics dashboard · Tally XML export · Feedback · Activity logs · User admin.

## Technical mapping

| Current (React + Lovable Cloud)      | Laravel + MySQL equivalent                         |
| ------------------------------------ | -------------------------------------------------- |
| Postgres tables                      | MySQL 8 tables via migrations                      |
| RLS policies + `has_role()` RPC      | Middleware + Gate/Policy classes                   |
| Supabase Auth                        | Laravel Breeze (session auth, mobile+password)     |
| Edge functions (`send-sms`, etc.)    | Laravel Service classes + queued jobs              |
| Storage buckets (`avatars`, `cheques`) | `storage/app/public` with `php artisan storage:link` |
| React pages/components               | Blade views + Tailwind (kept as-is from CDN)       |
| `mysql-sync` edge function           | Not needed — MySQL is the primary DB               |

Frontend approach in Laravel: **server-rendered Blade + Tailwind CDN + Alpine.js** for interactivity. This is the fastest path and keeps the ZIP self-contained. I will *not* try to reuse the React components — porting the UI to Blade is part of the work.

## Deliverables

1. `jukibd-laravel.zip` in `/mnt/documents/` (the full project).
2. `mysql-schema.sql` in `/mnt/documents/` (standalone DB dump you can also import directly into any MySQL/MariaDB server).
3. A short setup guide in `README.md` covering: `composer install`, `.env` config, `php artisan migrate --seed`, `php artisan storage:link`, `php artisan serve`.

## What you need to do after download

1. Install PHP 8.2+, Composer, MySQL 8.
2. Unzip, `composer install`, copy `.env.example` → `.env`, set MySQL creds and BulkSMSBD key, `php artisan key:generate`.
3. `php artisan migrate --seed`, then `php artisan serve`.

## Caveats — please read

- **Size**: this is a large port (25+ tables, ~40 screens). The generated Laravel code will be functional scaffolding, not pixel-identical to the current React UI. Expect to polish Blade views afterward.
- **No live preview**: nothing in the Lovable preview will change. Verification of the Laravel app has to happen on your own machine.
- **One-time export**: future changes you make in the Lovable React app will *not* auto-sync into the exported Laravel code. Pick one as your source of truth going forward.
- **Existing data**: `mysql-schema.sql` will include current reference/config data. If you also want a dump of live business data (jobs, clients, invoices), say so and I'll include it.

## If you approve

I'll generate everything in one build pass and reply with the `<presentation-artifact>` links for the ZIP and the SQL dump.
