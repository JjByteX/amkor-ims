# Phase 6 — Fix Instructions

## Files in this zip and what to do with each

### DROP-IN REPLACEMENTS
Drag and drop these folders directly into your project root — they mirror the exact
folder structure. Existing files with the same path will be overwritten. New files
will be added.

---

### 1. `Modules/AccountsReceivable/database/migrations/`
**What:** The `collectibles` migration moved to the correct location.

**Problem:** The migration was placed in the root `database/migrations/` instead of
the module's own `database/migrations/` folder. nwidart modules auto-discover their
own migrations, so it must live in the module.

**Action after dropping in:**
→ Delete `database/migrations/2026_06_06_110000_create_collectibles_table.php`
  from the ROOT database/migrations folder (the one that's NOT inside Modules/).
→ Then run `php artisan migrate` (or re-run if already migrated — it will be a no-op
  if the table already exists, which is fine).

---

### 2. `Modules/AccountsReceivable/app/Models/Collectible.php`
**What:** Fixed the `contact()` relationship.

**Problem:** The model referenced `\App\Models\Contact::class` — that class does not
exist. The Contact model lives at `Modules\Contacts\Models\Contact`.

**Action:** Just drop in. No migration or artisan commands needed.

---

### 3. `resources/js/Pages/AccountsReceivable/Edit.jsx`
**What:** The missing Edit page.

**Problem:** The controller has a working `edit()` and `update()` method, and the
routes are registered, but the Inertia page component `AccountsReceivable/Edit`
did not exist. Navigating to `/ar/{id}/edit` would crash with a "page not found"
error from Inertia.

**Action:** Just drop in. No other changes needed.

---

## Phase 6 Exit Checklist
After applying all fixes, verify:
- [ ] `php artisan migrate` runs without errors (collectibles table created)
- [ ] `/ar` index loads and shows summary cards
- [ ] Create a new collectible from RESA, Visa, and Ormoc officer accounts
- [ ] Balance auto-calculates correctly on create
- [ ] Edit page loads at `/ar/{id}/edit` and saves correctly
- [ ] Approved record shows "locked" message when trying to edit
- [ ] COO approval button visible to COO/GM only
- [ ] GSM approval button visible to GSM/GM only
- [ ] After both approve: post-approval action panel appears
- [ ] Record payment → balance updates
- [ ] Endorse to Disbursement / Process Refund / Endorse Documents all work
- [ ] Overdue flag appears on records past due date
- [ ] Branch-scoped roles (RESA, Visa, Ormoc officers) see only their branch records
- [ ] Admin Auditor and GM see all branches
