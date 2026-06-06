# Phase 4 — Visa & Documentation Module
## Delivery Notes

---

## What's in this zip

Everything in this zip mirrors the folder structure of your `amkor-ims/` project.
Drag the contents of each top-level folder into the matching folder in your project.

---

## Problems fixed

Three files from a previous attempt were placed in the wrong locations.
They have been moved to the correct paths and are included here with fixed namespaces.
**Delete the old misplaced files** after copying the new ones in:

| Delete this (wrong) | Replaced by (correct) |
|---|---|
| `Modules/Visa/Http/Requests/StoreVisaApplicationRequest.php` | `Modules/Visa/app/Http/Requests/StoreVisaApplicationRequest.php` |
| `Modules/Visa/Mail/VisaPaymentRequestMail.php` | `Modules/Visa/app/Mail/VisaPaymentRequestMail.php` |
| `Modules/Visa/Models/VisaApplication.php` | `Modules/Visa/app/Models/VisaApplication.php` |

The namespaces in those files are unchanged — only the folder location is corrected.

---

## Files delivered

### Backend (Modules/Visa/)

| File | What it does |
|---|---|
| `app/Http/Controllers/VisaController.php` | All CRUD + workflow actions. Updated import paths. |
| `app/Http/Requests/StoreVisaApplicationRequest.php` | Form validation. **Moved from wrong location.** |
| `app/Mail/VisaPaymentRequestMail.php` | Queued email to Disbursement Officer. **Moved from wrong location.** |
| `app/Models/VisaApplication.php` | Eloquent model with all constants + scopes. **Moved from wrong location.** |
| `app/Providers/VisaServiceProvider.php` | Registers the scheduler command for Phase 12 activation. |
| `app/Console/Commands/SendVisaPaymentReminders.php` | **NEW** — Artisan command run daily at 08:00. Finds applications due tomorrow and queues reminder emails. |

### Frontend (resources/js/Pages/Visa/)

| File | What it does |
|---|---|
| `Index.jsx` | Application list with search, agent filter, status filter, pagination, status badges, and flag indicators. |
| `Create.jsx` | New application form — auto-computes income from SP and NP. |
| `Edit.jsx` | Pre-populated edit form — same layout as Create. |
| `Show.jsx` | Full detail view + all workflow actions: Update Status, Add/Edit Notes, Send Payment Request, Record OR, Endorse OR. |

### Config

| File | What it does |
|---|---|
| `config/mail.php` | Updated for Gmail SMTP. Default stays `log` (dev). Switch to `smtp` for production. |
| `.env-snippets/gmail-smtp.txt` | Step-by-step Gmail App Password instructions + the exact .env lines to add. |

---

## Steps after copying files

1. **Delete the 3 misplaced files** (see table above).

2. **Copy this delivery into your project** — drag and drop each folder.

3. **Add the Gmail SMTP variables to your `.env`** — see `.env-snippets/gmail-smtp.txt`.
   Keep `MAIL_MAILER=log` for now. Switch to `smtp` only when ready to test real email.

4. **The migration already exists** in your project:
   `database/migrations/2026_06_06_000004_create_visa_applications_table.php`
   Run `php artisan migrate` if you haven't already.

5. **Start the queue worker** (needed for email queueing):
   ```
   php artisan queue:work
   ```
   This is separate from `php artisan serve`. Open a second terminal for it.

6. **Test the visa payment request** manually:
   - Log in as `visa@amkor.ph`
   - Create an application with a Payment Due Date set
   - Click "Send Payment Request"
   - With `MAIL_MAILER=log`, check `storage/logs/laravel.log` for the email content

---

## Phase 4 exit checklist

- [ ] `/visa` loads — list shows, filters work
- [ ] Create application: all fields save, income auto-computes from SP and NP
- [ ] Status walks through all 7 values (Pending → On Process → Completed → Approved → Denied → Forfeited → Refunded)
- [ ] Notes attach and display with the yellow left-border indicator
- [ ] Payment request button sends queued email (check `laravel.log` in dev)
- [ ] OR number records correctly after request sent
- [ ] OR endorsement action marks `or_endorsed_at` and locks the button
- [ ] Visa Officer cannot see QC RESA or Ormoc records (branch scope enforced)
- [ ] Disbursement Officer and Admin Auditor can view but not write

**Human sign-off required before Phase 5.**

---

## Email — Phase 12 note

The scheduler (`visa:send-payment-reminders`) is registered and will run daily at 08:00
when the Laravel scheduler is active (`php artisan schedule:run` in production cron).
During development, trigger it manually:

```
php artisan visa:send-payment-reminders
```

Full end-to-end email testing with real Gmail credentials happens in Phase 12.
