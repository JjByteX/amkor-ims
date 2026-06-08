# Amkor IMS Checkpoint - Requirements Alignment Audit and Corrective Plan

Date: 2026-06-08
Repo audited: `https://github.com/JjByteX/amkor-ims`
Primary business source: Amkor Travel & Tours Inc. transcript and Drive workflow documents
Checkpoint stance: assume the system is wrong until the repo proves exact alignment

---

## 1. Executive checkpoint

The current Amkor IMS repository is a promising technical scaffold, but it is not yet aligned enough with Amkor Travel & Tours Inc.'s real manual workflow to be considered workflow-ready. It has the correct general direction: Laravel, React/Inertia, PostgreSQL, modular structure, RBAC package, audit package, media/PDF/Excel packages, seeded users, branches, and a broad set of modules that correspond to Amkor departments.

However, the current implementation still behaves mainly like module-level CRUD with seeded demo records and partial status fields. The actual business problem is deeper: Amkor needs a system that replaces Excel-driven operational tracking, enforces multi-role approvals, moves work between Reservation, Visa, Ormoc, Accounting, Disbursement, Audit, Marketing, and HR, generates operational and BIR documents, tracks due dates and aging, preserves branch-level data boundaries, sends alerts, and produces management reports.

The correct conclusion is:

> The system has module names and some correct model fragments, but it does not yet encode Amkor's actual workflows as enforceable business processes.

The checkpoint therefore recommends breaking and refactoring major parts of the system now, before more UI and reporting is built on an inaccurate domain model.

---

## 2. Source material considered

This checkpoint is based on the following requirement sources already reviewed:

1. Video transcript requirements shared by the user.
2. Google Drive folder containing Amkor manual workflow materials and project documents.
3. `Notes.md` from the Drive package, which summarizes company profile, branches, modules, manual processes, workflow pain points, and system requirements.
4. `Mandatory UI UX.md`, which defines Amkor visual requirements, colors, typography, icons, radius, and light/dark mode expectations.
5. Role and permission requirements from the Drive documents.
6. Proposal and requirements documents in the Drive package.
7. Current repo files in `JjByteX/amkor-ims`, including README, Composer dependencies, package dependencies, module routes, controllers, models, seeders, and selected services.

Important note: the earlier CureRays repo inspection was a false lead and must be disregarded for Amkor scope. The correct repository for this checkpoint is `JjByteX/amkor-ims`.

---

## 3. True current status

The README claims the system covers 19 modules, 12 roles, and 3 branches. The repo also claims Phase 10 HR, Attendance, and Marketing are implemented, Phase 11 Sales Summary is implemented, and Phase 12 Notifications is implemented.

This checkpoint does not accept those phase labels as proof of completion.

A phase is only complete if the implementation satisfies all of the following:

1. The data model matches the columns and operational meaning of the manual files.
2. The workflow enforces the actual steps, approvals, ownership, and handoffs.
3. The role and branch rules match the role matrix and operational boundaries.
4. The UI exposes the required actions without hiding workflow gaps.
5. Required reports and exports reproduce the manual management outputs.
6. Notifications fire from real due dates, thresholds, and workflow events.
7. Audit logs capture sensitive and financial changes.
8. Generated documents match the source templates and BIR expectations.
9. The feature can be tested with migrated sample data from the real manual files.

Using that stricter definition, the true status is:

- Auth, branch, role, and user foundations exist, but authorization is not consistently enforced through policies.
- Reservation exists, but the model and workflow are incomplete compared to the RESA manual sales report and process flow.
- Visa exists and captures many correct fields, but the payment/OR/embassy/disbursement workflow is still not fully enforceable.
- Ormoc exists and includes important branch-specific rules, but it must be integrated into shared finance, sales, and branch isolation workflows.
- AR/AP/Disbursement modules exist, but the system does not yet fully enforce actual approval gates and document handoffs.
- BIR and document generation exist partially, but they do not yet cover the complete compliance and template-update process described in the transcript.
- HR, Attendance, Marketing, Sales Summary, and Notifications exist as technical modules, but they require major corrections before they can be called aligned.

---

## 4. Cross-system diagnosis

### 4.1 The repo solves the wrong layer first

The repo has many tables, models, routes, controllers, and pages. That is useful, but Amkor's operational risk is not simply lack of forms. Their risk is that information is scattered across Excel files, manual handoffs, staff memory, email requests, accounting documents, and audit checks.

A correct IMS must center on business state:

- Inquiry state
- Quotation state
- Booking state
- Client confirmation state
- Payment state
- SOA/AR/SI/OR document state
- Supplier/operator payable state
- Disbursement/voucher state
- Audit/approval state
- BIR/reporting state
- Branch visibility state
- Aging and due-date state

The current repo tends to flatten these into single records with status fields and booleans. That will eventually fail because a boolean cannot explain who approved, what evidence was attached, what document was missing, what step blocked the transaction, why a transaction was changed, or whether the next role has been notified.

### 4.2 The system is still module-centric, not workflow-centric

The manual operation crosses departments. For example:

- Reservation receives inquiry.
- RESA prepares quotation.
- Client confirms.
- Accounting may issue SOA or receipt depending on FIT vs corporate/sub-agent.
- RESA sends PO to supplier.
- Accounting informs Disbursement.
- Disbursement prepares payment/voucher/deposit.
- Audit checks documents.
- JRT or approver gives go signal.
- Proof is emailed and filed.
- Sales, collectibles, payables, and BIR reports must reflect the transaction.

The repo currently creates separate modules, but there is no central workflow engine proving that these handoffs are enforced. Events exist in a limited way, but not enough to model the actual business process.

### 4.3 The system relies too much on hard-coded constants

Examples include hard-coded role arrays, hard-coded agent code lists, hard-coded document types, hard-coded payment modes, and hard-coded branch rules in controllers/models.

Hard-coded constants are acceptable for initial scaffolding, but they are not acceptable as the final business implementation because Amkor's users, agents, roles, services, and branches may change. The system should move these into configurable tables and admin screens where appropriate.

### 4.4 The system does not yet prove data migration readiness

The real business data currently lives in manual work documents and Excel-like structures. A production-ready IMS must be able to import, normalize, validate, and reconcile existing records. The current repo seeds demo records but does not yet prove it can ingest real Amkor files while preserving legacy document numbers, agent codes, historical balances, and branch-specific records.

### 4.5 The current phase labels should be downgraded

The README says Phase 10 to Phase 12 are implemented. This should be treated as implementation optimism, not verified truth.

Recommended checkpoint classification:

- Phase 1 Auth/RBAC foundation: partial
- Phase 2 Contacts/directory: partial
- Phase 3 Reservation: partial, requires refactor
- Phase 4 Visa: partial, requires workflow hardening
- Phase 5 Ormoc: partial, requires finance integration hardening
- Phase 6 AR: partial, requires approval and document workflow hardening
- Phase 7 AP/Disbursement: partial, requires voucher/payable state machine
- Phase 8 Cashbond/Bills/Credit Card/IATA: partial, requires scheduled monitoring
- Phase 9 BIR/Document Generation: partial, requires template registry and real exports
- Phase 10 HR/Attendance/Marketing: not complete by requirements definition
- Phase 11 Sales Summary: not complete by requirements definition
- Phase 12 Notifications: not complete by requirements definition

---

## 5. Detailed findings by area

## 5.1 Repository and architecture

### What exists

The repo uses Laravel 12, React/Inertia, PostgreSQL, Laravel Reverb, nwidart modules, Spatie Permission, Spatie Activitylog, Spatie Medialibrary, Laravel Backup, DomPDF, and Maatwebsite Excel. This is a reasonable stack for the requested system.

The README claims 19 modules:

1. Auth
2. Contacts
3. Reservation
4. Visa
5. OrmocBranch
6. AccountsReceivable
7. AccountsPayable
8. Disbursement
9. Cashbond
10. BillsMonitoring
11. CreditCardMonitoring
12. IataPayments
13. BirCompliance
14. DocumentGeneration
15. EmployeeRecords
16. Attendance
17. Marketing
18. SalesSummary
19. Notifications

### What fails

The architecture rule says modules should communicate through Laravel Events only, but existing models directly reference models from other modules in some places, such as AR/AP referencing Contacts and AP referencing Disbursement vouchers. That may be practical, but it contradicts the stated architecture rule and can produce tight coupling if not formalized.

The repo documentation also drifts from actual dependencies. The README says PHP 8.4 is required, while `composer.json` allows PHP `^8.2`. The composer package still identifies itself as `laravel/laravel` with the skeleton description instead of an Amkor-specific app identity. These mismatches must be cleaned because they signal that documentation and actual implementation are not under strict control.

### Corrective direction

- Treat the README as project intent, not proof.
- Add a `docs/checkpoints/` folder with this checkpoint and future audit logs.
- Add a `docs/requirements-traceability-matrix.md` that maps every transcript/Drive requirement to a module, model, workflow, UI page, test, and completion state.
- Decide whether cross-module model references are allowed. If yes, update architecture rules. If no, refactor to domain events/read models.
- Align `composer.json`, README, `.env.example`, and setup docs.

---

## 5.2 UI/UX alignment

### What the Drive requires

`Mandatory UI UX.md` defines Amkor's visual direction:

- Primary Green: `#3F9800`
- Dark Green: `#2E6F00`
- Background: `#F9FAFB`
- Card: `#FFFFFF`
- Text: `#0F172A`
- Success, warning, error, and info status colors
- Dark mode equivalents
- Headings: Manrope SemiBold
- Body: Inter Regular
- Headings: 20px
- Body: 16px
- Lucide Icons
- Corner radius: 8px
- Light mode default with dark mode option
- Layered black shadows

### What must be checked or corrected

The repo uses Lucide and React, which is aligned. However, the UI must be verified against the required palette, typography, radius, shadows, and light/dark behavior. The system should not look like a generic admin dashboard. It should feel like a polished private internal travel-operations system.

### Corrective direction

- Create a single design token file for Amkor colors, typography, shadows, spacing, and radius.
- Remove any inconsistent module-local styling.
- Add shared table, form, card, badge, status, filter, empty-state, and workflow-step components.
- Add a light/dark mode toggle if not already implemented.
- Make UI copy match Amkor language: RESA, Visa Centre, Ormoc, Collectibles, Payables, Disbursement, Cashbond, BIR, Sales Summary.

---

## 5.3 Reservation / RESA

### Requirement summary

Reservation handles FIT and corporate/sub-agent bookings for QC. The manual sales report tracks:

- Agent
- PO Date
- Corporate account or travel agency
- Passenger names
- Particulars
- Airline
- PO number
- SI number
- OR number
- AR number
- SOA number
- Selling Price
- Net Payable
- Income
- Excess
- Insurance Nett
- ACR
- Mode of Payment
- Date of Payment
- Transaction Type
- Status
- Remarks
- Contact person
- Contact number
- Email address
- Source
- Audit remarks

The FIT process and corporate/sub-agent process have different accounting/document flow.

### Current repo finding

The `ReservationBooking` model has some relevant fields: booking number, date, agent code, client name, contact number, email, corporate account, destination, travel/return dates, pax count, service type, particulars, inclusions, exclusions, selling price, net payable, income, payment mode, payment due date, SOA/PO/SI/AR/OR numbers, status, accounting forwarding fields, remarks, audit remarks, branch, created/updated users.

But it misses or under-represents important manual fields:

- Airline
- Passenger list as structured data
- PO date
- Excess
- Insurance nett
- ACR
- Date of payment
- Transaction type
- Source
- Contact person separate from contact number/email
- FIT vs Corporate/Sub-agent workflow distinction
- Operator/supplier invoice linkage
- Attached document checklist
- Accounting transaction package
- Purchase order lifecycle
- SOA lifecycle
- Audit submission lifecycle

It also uses an incomplete `AGENT_CODES` constant. The real RESA codes from the notes include RT, RP, AL, EJ, KG, CM, JR, MMT, JMMT, JF, KL, and EB, while the repo list is much shorter and includes generic placeholders.

The income calculation uses `max(0, selling_price - net_payable)`, which hides negative margins. Accounting systems should not hide losses or under-recoveries. Negative income, excess, discounts, and adjustments must be visible.

### Required refactor

Break the flat reservation model if needed.

Recommended model structure:

- `reservation_inquiries`
- `reservation_quotations`
- `reservation_bookings`
- `reservation_passengers`
- `reservation_suppliers`
- `reservation_documents`
- `reservation_accounting_packets`
- `reservation_payments`
- `reservation_purchase_orders`
- `reservation_workflow_events`

At minimum, add these fields to `reservation_bookings` or related tables:

- `booking_category`: FIT, corporate, sub_agent
- `po_date`
- `airline`
- `passenger_summary` or related passenger rows
- `contact_person`
- `payment_date`
- `transaction_type`
- `source`
- `excess_amount`
- `insurance_nett`
- `acr_amount`
- `supplier_invoice_no`
- `operator_name`
- `accounting_packet_status`
- `audit_submission_status`

Replace `AGENT_CODES` constant with a managed `agent_codes` table tied to branch, department, employee/user, active status, and effective dates.

### Workflow states needed

Use separate statuses instead of one generic `status`:

- Inquiry status: received, quoted, lost, converted
- Quotation status: draft, sent, revised, accepted, rejected, expired
- Booking status: pending, confirmed, cancelled, completed
- Payment status: unpaid, partially_paid, paid, refunded
- Accounting status: not_required, pending_soa, soa_sent, awaiting_payment, receipt_issued, forwarded_to_disbursement
- Supplier status: po_pending, po_sent, invoice_received, payable_created, paid
- Audit status: not_submitted, submitted, checked, rejected, approved

### Acceptance criteria

Reservation is aligned only when the system can handle both FIT and corporate/sub-agent scenarios end-to-end and reproduce the manual sales report fields without data loss.

---

## 5.4 Visa and Documentation

### Requirement summary

Visa tracks:

- Agent
- Date
- Agency
- Customer name
- Visa type/service
- Selling Price
- Net Payable
- Income
- Status
- Payment Date
- SOA
- SI number
- AR number
- Mode of payment

It must support statuses:

- Pending
- On Process
- Completed
- Approved
- Denied
- Forfeited
- Refunded

The workflow includes:

1. Receive inquiry.
2. Provide requirements list.
3. Client submits requirements and original passport.
4. Officer fills online form, prints, validates requirements.
5. Client pays amount due.
6. Officer schedules embassy filing and turns over documents to Liaison Officer.
7. Officer records transaction in monitoring file.
8. Payments must match within the day.
9. Payment to embassy may be cash or credit card depending on supplier/embassy terms.
10. Officer requests payment by email one day before payment date.
11. Disbursement prepares cash/voucher.
12. Liaison pays embassy and returns OR.
13. Visa Officer collects OR and endorses to Accounting Disbursement.
14. Disbursement checks and turns over documents to Admin Auditor/GM.

### Current repo finding

The `VisaApplication` model is closer to the requirements than Reservation. It includes agent code, date, agency, customer, visa type, SP/NP/income, status, notes, mode of payment, payment date, SOA/SI/AR, payment due date, payment request flags, OR number, OR received/endorsed fields, branch, creator/updater.

It also includes a strong list of visa/service types and payment modes.

But the workflow is still incomplete:

- Requirements checklist is not modeled.
- Original passport custody is not modeled.
- Embassy filing schedule is not modeled.
- Liaison turnover is not modeled.
- Payment matching within the day is not enforced.
- Embassy payment method and proof are not strongly modeled.
- Admin Auditor/GM legitimacy check is not modeled as a required approval.
- Automatic one-day-before payment request is not guaranteed by a scheduler.

### Required refactor

Add these models or fields:

- `visa_requirements_checklists`
- `visa_requirement_items`
- `visa_passport_custody_logs`
- `visa_embassy_filings`
- `visa_liaison_turnovers`
- `visa_payment_requests`
- `visa_embassy_payments`
- `visa_or_endorsements`
- `visa_audit_reviews`

Add scheduled job:

- `visa:send-payment-reminders`

This job should detect visa applications where:

- `payment_due_date = tomorrow`
- payment request not sent
- application not cancelled/refunded
- required fields are complete

It should notify and email Disbursement Officer, with escalation to General Manager if overdue.

### Acceptance criteria

Visa is aligned only when an application cannot proceed to filing/payment/audit states unless required documents, passport status, payment request, liaison handoff, OR proof, and final audit review are completed or explicitly marked not applicable with reason.

---

## 5.5 Ormoc Branch

### Requirement summary

Ormoc operates as a separate branch with local booking and domestic/international rules. Requirements include:

- Branch separation
- Ormoc-specific agent codes
- Domestic booking flow
- International booking escalation to Head Office or Mariposa
- Credit card surcharge handling
- Passport expiry checking
- PO forwarding
- Accounting forwarding
- Sales inclusion in Ormoc totals

### Current repo finding

The `OrmocBooking` model includes many correct fields: agent, date, client, contact, email, booking type, destination, travel date, pax, hotel, room, flight details, inclusions/exclusions, SP/NP/income/excess, insurance, ACR, mode of payment, credit card surcharge flag, payment date, PO/SI/OR/AR/SOA, transaction type, source, audit remarks, passport expiry flag, escalation fields, Mariposa PO fields, accounting forwarding fields, branch, creator/updater.

This model is stronger than Reservation in several ways because it includes excess, insurance, ACR, transaction type, source, surcharge, passport, and escalation fields.

### What still fails

- The same fields should be harmonized with Reservation where applicable.
- The Ormoc model should not become a parallel universe with similar but incompatible booking data.
- Escalation to Head Office/Mariposa should be a workflow step with ownership, documents, status, and notification, not just a boolean.
- Credit card surcharge should create a visible financial line item, not just a flag/computed helper.
- Passport expiry check should run automatically when travel date or passport expiry changes.
- Ormoc must be branch-isolated by policy, not controller-local conditionals.

### Required refactor

Either:

1. Keep a separate Ormoc module but extract shared booking/accounting document concepts into shared domain tables, or
2. Merge Reservation and Ormoc into a shared booking core with branch-specific workflow extensions.

Recommended approach:

- Introduce shared `bookings` core table for common booking/accounting fields.
- Keep `reservation_booking_details` and `ormoc_booking_details` for branch-specific fields.
- Use `branch_id`, `department`, and `workflow_definition_id` to select correct behavior.

### Acceptance criteria

Ormoc is aligned only when an Ormoc user can manage only Ormoc records, Head Office can see required escalations, and Ormoc sales roll into branch totals without duplicating or corrupting QC data.

---

## 5.6 Accounts Receivable / Collectibles

### Requirement summary

AR/Collectibles tracks:

- Branch/Department
- Agent
- Date
- Travel agency/corporate account
- Customer
- Particulars
- Travel date
- Terms
- Collectible amount in PHP and USD
- Payment received in PHP and USD
- Balance in PHP and USD
- Due date
- Number of days
- Status
- Remarks

Workflow includes:

1. PAX payment received.
2. Receipt issuance.
3. Transaction documents compiled.
4. Checking stage.
5. Side processes: IATA/Operator Bill and Refund.
6. Approval by COO and GSM.
7. If approved, input transaction.
8. Cash/check endorsement to Disbursement.
9. Billing invoice processing to Disbursement.
10. AR/OR report to Audit.
11. Refund processing to Audit.
12. Documents endorsed to Audit.

### Current repo finding

The `Collectible` model includes many required fields and approval flags. It supports PHP/USD collectible amounts, payments, balances, due dates, days outstanding, status, approval status, COO/GSM approval, endorsement to disbursement, refund, document endorsement, OR/AR/SI, remarks, audit remarks, branch, created/updated users.

This is a good foundation.

### What still fails

- Approval state is partly represented, but likely not enforced by a formal approval workflow.
- Receipt issuance is not strongly tied to generated AR/SI/SOA documents.
- Cash/check endorsement and billing invoice processing should generate tasks and document requirements.
- Refund process should be a separate workflow with audit evidence.
- Payment received should probably be normalized into payment records, not only stored as aggregate amounts.
- Terms/due-date logic and aging reports must be operational, not just fields.

### Required refactor

Add:

- `collectible_payments`
- `collectible_documents`
- `collectible_approvals`
- `collectible_refunds`
- `collectible_audit_events`

Use a state machine for approval:

- draft
- submitted_for_checking
- checked
- coo_approved
- gsm_approved
- fully_approved
- rejected
- endorsed_to_disbursement
- reported_to_audit
- closed

### Acceptance criteria

AR is aligned only when a collectible cannot become fully approved or closed without the required receipts, approvals, document endorsements, and audit/report actions.

---

## 5.7 Accounts Payable / Payables to Operators

### Requirement summary

Payables track:

- Requisition number
- Invoice date
- Invoice number
- Supplier name
- Invoice amount in PHP, USD, JPY
- Payment in PHP, USD, JPY
- Balance in PHP, USD, JPY
- Due date
- Number of days
- Payment date
- Status
- Remarks
- Mode of payment
- Account number
- ACR

Workflow:

1. Payment request from RESA with billing/invoice.
2. Check due date.
3. If not yet due, file invoice until due date.
4. If due, confirm AR or SOA and verify NET on Sales Report Monitoring.
5. Prepare voucher, cheque or cash payment, and deposit slip.
6. Checked by Audit.
7. Approved by JRT.
8. Email operator with scanned deposit slip.
9. Attach deposit slip, scan, and file documents.

### Current repo finding

The `Payable` model has good multi-currency support and fields for requisition, invoice, supplier, PHP/USD/JPY amounts, due date, payment date, status, approval status, checked/approved/released, payment mode, account number, ACR, check number, deposit slip attached, voucher, remarks, audit remarks, branch, creator/updater.

### What still fails

- Due-date decision logic is not formalized as workflow.
- Verification against AR/SOA and sales report NET is not modeled.
- Deposit slip as actual attachment/evidence is not clearly enforced.
- Emailing the operator with proof should be a workflow action with recipient and timestamp.
- Approval by JRT should be tied to General Manager role and auditable.
- Filed/unfiled states should be explicit.

### Required refactor

Add:

- `payable_source_documents`
- `payable_verifications`
- `payable_payment_runs`
- `payable_operator_emails`
- `payable_deposit_proofs`
- `payable_approvals`

Required workflow states:

- request_received
- not_due_filed
- due_for_verification
- verified_against_ar_or_soa
- voucher_prepared
- audit_checked
- jrt_approved
- payment_released
- proof_emailed
- filed
- closed

### Acceptance criteria

AP is aligned only when payment release is impossible unless verification, voucher, audit check, JRT approval, payment proof, and filing evidence are complete.

---

## 5.8 Disbursement

### Requirement summary

Disbursement handles:

- Cash/check vouchers
- Utility bills
- Membership renewals
- Permits
- Premium payments
- Office supplies
- Cashbond portal reloads
- Credit card due dates
- Access files sent every 15th and end of month
- Branch-separated reporting
- Daily recording of expenses, cash in fund, withdrawals, and transfers
- Matching physical cash, cash on bank, and access files
- Report generation for external accounting and tax scheduling

### Current repo finding

The existence of a Disbursement module and voucher model is useful, and AP references vouchers. Document generation also uses vouchers for cash/check voucher PDFs.

### What still fails

- Disbursement should be a financial hub, not only voucher records.
- Daily cash/bank/access-file reconciliation must be explicit.
- Access-file submission schedule must be modeled and monitored.
- Branch segregation must be enforced.
- Vouchers need lifecycle states: prepared, checked, approved, released, filed.
- Voucher attachments need proof/evidence.

### Required refactor

Add or verify:

- `vouchers`
- `voucher_lines`
- `voucher_attachments`
- `disbursement_ledger_entries`
- `fund_transfers`
- `bank_withdrawals`
- `cash_reconciliations`
- `access_file_submissions`
- `external_accounting_reports`

Scheduled jobs:

- `disbursement:access-file-reminders` on every 15th and end of month.
- `disbursement:reconciliation-reminders` daily.

### Acceptance criteria

Disbursement is aligned only when vouchers, payments, cash/bank/access-file records, and branch reports can be reconciled and audited.

---

## 5.9 Cashbond Monitoring

### Requirement summary

Cashbond portals:

- AirAsia
- Jetstar
- SupercatB2B
- Airswift
- Cebuana Lhuillier

Workflow:

1. Check daily balance of each portal.
2. If below maintaining balance, prepare reload request.
3. Prepare requisition form and voucher.
4. Audit checks.
5. JRT approves.
6. Ready for deposit.
7. Email supplier for confirmation and balance update.
8. Update Bonds Monitoring file.
9. Complete attachments and file documents.

### Current risk

The repo has a Cashbond module and seeder, but the checkpoint must verify whether it actually performs threshold monitoring, reload workflow, voucher linkage, supplier email, proof attachment, and balance update history.

### Required refactor

The Cashbond module must include:

- `cashbond_portals`
- `cashbond_balance_checks`
- `cashbond_reload_requests`
- `cashbond_reload_approvals`
- `cashbond_reload_deposits`
- `cashbond_supplier_confirmations`
- `cashbond_attachments`

Scheduled job:

- `cashbond:check-thresholds`

### Acceptance criteria

Cashbond is aligned only when low-balance thresholds generate actionable reload requests and cannot close without voucher, audit check, JRT approval, deposit proof, supplier confirmation, and updated balance.

---

## 5.10 Bills Monitoring, Credit Card Monitoring, and IATA Payments

### Requirement summary

Bills/On-Ques Monitoring workflow:

1. Monitor daily due dates.
2. Identify due bill and print billing for attachment.
3. Prepare voucher and requisition form.
4. Audit checks.
5. JRT approves.
6. Pay by credit card or deposit.
7. Update monitoring and file documents.

Credit Card workflow:

1. Monitor daily card due dates.
2. Identify due card and request billing.
3. Decide if payment is needed.
4. If no, update data sheet monitoring.
5. If yes, prepare voucher and check payment.
6. Audit checks.
7. JRT approves.
8. Deposit/payment prepared.
9. Update records and file documents.

IATA workflow:

1. Confirm billing from operator.
2. Accounting prepares requisition.
3. Prepare voucher, cheque payment, and deposit slip.
4. Audit checks.
5. JRT approves.
6. Email operator with scanned deposit slip.
7. Attach proof and file documents.

### Current risk

These modules exist, but a module existing is not enough. They must implement scheduled due-date monitoring, document attachments, voucher linkage, audit checks, JRT approval, payment proof, update loops, and filing.

### Required refactor

Add shared financial monitoring pattern:

- `monitored_obligations`
- `obligation_due_dates`
- `obligation_documents`
- `obligation_vouchers`
- `obligation_approvals`
- `obligation_payment_proofs`
- `obligation_notifications`

Or implement equivalent module-specific tables with a common workflow service.

Scheduled jobs:

- `bills:due-reminders`
- `credit-cards:due-reminders`
- `iata:payment-reminders`

### Acceptance criteria

These modules are aligned only when due dates automatically surface, payments require approval, proof is stored, and monitoring files can be updated/reported by branch.

---

## 5.11 BIR Compliance and Document Generation

### Requirement summary

The transcript and notes require:

- TIN capture
- Auto-generation of BIR-related documents
- Monthly reminders for BIR forms
- Staff should still check BIR sources/templates for updates
- External accounting receives exported reports, not direct system access
- AR/SI/SOA and vouchers should be generated from structured fields
- No direct BIR API integration is required unless clarified later

### Current repo finding

There is a `BirTransaction` model with TIN, document type, document number, customer, address, gross amount, VAT breakdown, withholding tax, payment mode, transaction date, due date, year/month, branch, PDF generation flags, ATP number, particulars, and remarks.

There is a `DocumentGenerationController` that generates PDFs for:

- Acknowledgement Receipt
- Service Invoice
- Statement of Account
- Cash Voucher
- Check Voucher

This is a strong start.

### What still fails

- It does not prove full BIR form support, such as 2307 or 1702-type report handling mentioned in discussions.
- It does not yet implement a BIR template registry with version checking.
- The monthly export/report function appears placeholder in the BIR controller.
- It does not prove that AR/SI/SOA numbers are generated only from valid transactions.
- It does not prove immutable document numbering controls.
- It does not prove printed/generated PDF storage, versioning, or attachment to source transactions.
- It does not prove external accounting export packages.

### Required refactor

Add:

- `bir_form_templates`
- `bir_template_versions`
- `bir_monthly_report_runs`
- `bir_monthly_report_items`
- `generated_documents`
- `generated_document_versions`
- `document_number_sequences`
- `external_accounting_exports`

Required controls:

- Document numbers must be sequence-controlled and auditable.
- Generated documents should be stored and linked, not only downloaded.
- Regeneration should create a new version or require authorized void/reissue logic.
- Monthly reminders should be scheduled.
- BIR template review reminders should be scheduled.

Scheduled jobs:

- `bir:monthly-reminders`
- `bir:template-review-reminders`

### Acceptance criteria

BIR/Document Generation is aligned only when structured transactions can generate compliant documents, preserve generated versions, export monthly accounting packages, and remind staff to review/update templates.

---

## 5.12 HR / Employee Records

### Requirement summary

Employee records must track:

- Employee ID
- Gender
- Full name
- Nickname
- Date hired
- Maturity date
- Last evaluation date
- Salary increase
- Regularization date
- Tenure
- VL funds
- SIL
- Used SIL
- Remaining SIL
- Status
- Position
- Date of birth
- Bank account number
- PhilHealth
- SSS
- TIN
- Pag-IBIG
- Address
- Mobile number
- Contact person
- Contact number
- Medicard number
- PhilCare number
- Company Viber number
- Company email
- Company Outlook email
- Data privacy consent
- Uniform issuance tracking

### Current repo finding

The `Employee` model has first/last/middle/suffix, date of birth, gender, civil status, employee code, position, department, branch, employment status, date hired, regularization date, government IDs, personal/work email, mobile, address, emergency contact, SIL total/used, uniform records, data privacy consent, user linkage, and remarks.

### What fails

Missing or under-modeled fields include:

- Nickname
- Maturity date
- Last evaluation date
- Salary increase
- VL funds
- VL used/remaining
- Bank account number
- Medicard number
- PhilCare number
- Company Viber number
- Outlook email separate from company email
- Leave ledger/history
- Evaluation history
- Salary change history
- Uniform issuance history as structured records rather than only JSON

### Required refactor

Add fields or related tables:

- `nickname`
- `maturity_date`
- `last_evaluation_date`
- `bank_account_number`
- `medicard_number`
- `philcare_number`
- `company_viber_number`
- `company_email_outlook`

Add related tables:

- `employee_leave_balances`
- `employee_leave_transactions`
- `employee_evaluations`
- `employee_salary_adjustments`
- `employee_uniform_issuances`
- `employee_documents`

### Acceptance criteria

HR is aligned only when it can reproduce the Employee Details manual file, including leave balances and historical changes, without relying on one flat row for everything.

---

## 5.13 Attendance / Time Keeping

### Requirement summary

Attendance is currently manually encoded and tracked monthly. The transcript raised concerns about self clock-in abuse and suggested HR verification/logging as a safer control model.

### Current repo finding

The `AttendanceRecord` model supports time in/out, datetime stamps, minutes worked, late, undertime, status, leave type, IP, device info, HR override, branch, remarks, recorded/updated users.

The controller includes employee self-service clock-in and clock-out, plus HR override.

### What fails

Self-service clock-in may conflict with the actual control expectation. IP and device info are evidence, but not proof of physical presence. The safer interpretation is that attendance should remain HR-controlled or HR-approved unless the client explicitly approves self-service.

### Required refactor

Choose one of two modes:

Option A - HR-controlled attendance:

- Disable employee self clock-in/out in production.
- HR/Admin encodes attendance.
- Employees can view their own records only.

Option B - Employee attendance request with HR approval:

- Employee submits clock-in/out event.
- Record is pending until HR validates.
- HR can approve, reject, or override.
- All changes are auditable.

Recommended: Option B only if the client accepts the risk. Otherwise use Option A.

Add:

- `attendance_events`
- `attendance_approval_status`
- `approved_by`
- `approved_at`
- `rejected_by`
- `rejected_at`
- `rejection_reason`

### Acceptance criteria

Attendance is aligned only when it matches the client-approved control model and produces monthly attendance reports without exposing other employees' records to normal staff.

---

## 5.14 Marketing

### Requirement summary

Marketing workflow includes:

- Research destinations, hotels, competitor packages, and airline deals
- Create posters and itineraries
- COO reviews materials
- Distribute itineraries to all departments
- Publish social media content on Facebook, TikTok, Instagram
- Run paid ads and email blasts
- Collect testimonials
- Sales calls and travel events
- Edit announcements, collaterals, TV ads, office materials
- Monitor analytics and campaign performance

### Current repo finding

`MarketingMaterial` tracks title, material type, description, status, platform, caption, revision notes, publish date, creator/submitter/reviewer/approver/publisher, expenses, and analytics relationships.

This is a useful start.

### What fails

Marketing is currently centered on materials, but the real workflow is campaign/research/approval/distribution/analytics centered. A poster is an output, not the whole workflow.

Missing or under-modeled concepts:

- Research items
- Campaigns
- Destination/package deal research
- Competitor comparison
- Airline deal tracking
- Itinerary distribution to departments
- Paid ad budgets
- Email blast recipient/audience tracking
- Testimonials
- Sales calls
- Events
- Revision loop with COO comments
- Actual media attachments/design files

### Required refactor

Add:

- `marketing_campaigns`
- `marketing_research_items`
- `marketing_materials`
- `marketing_material_reviews`
- `marketing_distributions`
- `marketing_ad_spend`
- `marketing_email_blasts`
- `marketing_testimonials`
- `marketing_events`
- `marketing_analytics_snapshots`
- `marketing_assets`

Workflow states:

- research
- draft
- submitted_for_review
- revision_required
- approved
- scheduled
- published/distributed
- analytics_monitoring
- archived

### Acceptance criteria

Marketing is aligned only when campaigns can move from research to content to COO approval to distribution/publishing to analytics reporting.

---

## 5.15 Sales Summary

### Requirement summary

The sales summary must reproduce the actual management report. It should include:

- Annual target
- Monthly target
- Cumulative target
- Cumulative achieved
- Monthly columns from January to December
- Income per agent
- RESA group
- GROUPS subgroup
- QC total
- Ormoc total
- Grand total
- Progress report
- Excel/PDF export

### Current repo finding

The `SalesSummaryController` aggregates rows from Reservation, Ormoc, Visa, and AR for a selected year/month and returns totals, department summary, targets, filters, branches, and export ability.

The `SalesTarget` model has departments: reservation, ormoc, visa, and AR.

### What fails

This is not the same as the manual sales summary. It is a generic monthly aggregator, not the required annual matrix.

Missing:

- Jan-Dec columns
- Per-agent income matrix
- RESA vs GROUPS separation
- QC total
- Ormoc total
- Grand total
- Cumulative target
- Cumulative achieved
- Progress percentage
- Annual target rollup
- PDF export
- Exact Excel-like format

There is also a likely permission naming mismatch. The controller checks `sales.set_monthly_target`, but the seeded permission list appears to use a different naming style, such as `sales.set_targets`. This can break target-setting access.

### Required refactor

Rebuild Sales Summary around an explicit report model/service:

- `SalesSummaryReportService`
- `SalesMatrixBuilder`
- `SalesTargetProgressCalculator`
- `SalesSummaryExport`
- `SalesSummaryPdfExport`

Report rows:

- Agent rows
- RESA subtotal
- GROUPS subtotal
- Visa subtotal if required
- QC total
- Ormoc total
- Grand total
- Target rows
- Cumulative rows
- Variance rows

### Acceptance criteria

Sales Summary is aligned only when management can compare it against the current Excel report and see the same structure, totals, and month-by-month logic.

---

## 5.16 Notifications

### Requirement summary

The system needs notification and email support for:

- Workflow handoffs
- Payment due dates
- Visa payment request one day before payment date
- Payables due/overdue
- Collectibles due/overdue
- Cashbond below maintaining balance
- Bills due
- Credit card due dates
- IATA payment steps
- BIR monthly reminders
- Access files every 15th and end of month
- Marketing review/approval
- Attendance/HR alerts

### Current repo finding

The Notifications module supports database notifications, unread counts, read/archive/delete actions, and a dispatcher service. It has event listeners for reservation confirmed and reservation forwarded to accounting.

### What fails

The current implementation is not enough. It is mostly a notification center and a small number of reservation events. It does not yet prove scheduled reminders, broad workflow coverage, email delivery, escalation, or notification preferences.

The `WorkflowNotification` sends database notifications by default. Email only occurs if `sendMail` is true.

### Required refactor

Add notification sources:

- `NotificationRule`
- `NotificationPreference`
- `ScheduledReminderRun`
- `EscalationRule`

Scheduled jobs:

- `visa:payment-reminders`
- `payables:due-reminders`
- `ar:aging-alerts`
- `cashbond:threshold-alerts`
- `bills:due-reminders`
- `credit-cards:due-reminders`
- `iata:payment-reminders`
- `bir:monthly-reminders`
- `disbursement:access-file-reminders`
- `marketing:review-reminders`

Each notification should include:

- Source module
- Source record
- Title
- Message
- Severity
- Due date
- Owner role/user
- Escalation target
- In-app delivery
- Optional email delivery
- Read/archive state

### Acceptance criteria

Notifications are aligned only when the system actively watches dates, thresholds, and workflow states, not just when a user manually clicks a status button.

---

## 5.17 RBAC, data scope, and branch isolation

### Requirement summary

The system supports 12 roles:

1. General Manager
2. COO
3. GSM
4. Accounting Officer
5. Disbursement Officer
6. Admin Auditor
7. HR & Admin Officer
8. Liaison Officer
9. RESA Officer
10. Ormoc Branch Officer
11. Visa Officer
12. Marketing Officer

Branches:

- QC Main
- Visa Centre
- Ormoc Branch

Branch data must be separated. Ormoc data must be scoped separately from head office. External accounting and Mariposa have no login.

### Current repo finding

The repo uses Spatie Permission and seeds roles/permissions/users. That is good.

### What fails

Many controllers still hard-code role arrays. This creates multiple sources of truth and increases the risk of permission drift. For example, changing a permission in the seeder may not affect a controller that checks a hard-coded role string.

### Required refactor

Use Laravel Policies and Gates consistently.

For every module model, implement policies:

- `viewAny`
- `view`
- `create`
- `update`
- `delete`
- module-specific actions such as `approve`, `audit`, `release`, `generateDocument`, `export`, `endorse`, `forward`, `publish`

Add model scopes:

- `visibleTo(User $user)`
- `editableBy(User $user)` where needed

Remove controller-local role arrays except for temporary migration notes.

### Acceptance criteria

RBAC is aligned only when permission tests prove each role can do only what the Drive role matrix allows.

---

## 5.18 Audit logging

### Requirement summary

Financial records, approvals, generated documents, user/role changes, branch-sensitive records, and attendance edits must be auditable.

### Current repo finding

The repo includes Spatie Activitylog as a dependency. That is not proof of implemented audit logging.

### Required refactor

For all sensitive models, add activity logging:

- Reservation bookings
- Visa applications
- Ormoc bookings
- Collectibles
- Payables
- Vouchers
- Cashbond reloads
- Bills
- Credit card payments
- IATA payments
- BIR transactions
- Generated documents
- Employee records
- Attendance records
- Marketing approvals
- Sales targets
- User and role changes

Audit logs must record:

- Actor
- Action
- Before/after values where appropriate
- Source IP/device if relevant
- Timestamp
- Module
- Branch
- Reason for override/void/delete

### Acceptance criteria

Audit is aligned only when sensitive actions produce searchable logs visible to authorized roles.

---

## 6. Breaking changes that should be allowed

To align the system correctly, the team should explicitly allow breaking changes now. Continuing to layer UI on inaccurate models will create more rework.

Allowed breaking changes:

1. Rename or replace tables that do not match manual workflow semantics.
2. Split flat models into workflow-specific child tables.
3. Replace hard-coded constants with database-backed configuration tables.
4. Delete demo-only fields or booleans that hide real workflow states.
5. Replace controller role arrays with policies and permission checks.
6. Break existing seeders if the seeded data does not match real Amkor examples.
7. Rebuild Sales Summary instead of patching the current aggregator.
8. Disable or redesign self-service attendance if the client wants HR-controlled timekeeping.
9. Replace simple notification listeners with scheduled jobs and notification rules.
10. Change document generation to persist generated files and versions, not only download PDFs.
11. Add migrations that preserve or transform existing data rather than pretending current records are final.
12. Rework UI navigation and labels to match Amkor operations and required visual design.

---

## 7. Corrective implementation plan

## Phase A - Freeze and verify source-of-truth requirements

Goal: stop building on assumptions.

Tasks:

1. Create `docs/checkpoints/amkor-ims-alignment-checkpoint-2026-06-08.md` from this document.
2. Create `docs/requirements/source-inventory.md` listing every transcript, Drive document, spreadsheet, flowchart, form, and template reviewed.
3. Create `docs/requirements/traceability-matrix.md` with columns:
   - Requirement ID
   - Source document
   - Department/module
   - Manual file/column/process
   - Required data fields
   - Required workflow states
   - Required roles
   - Required notifications
   - Required documents/reports
   - Current repo location
   - Gap
   - Fix PR/commit
   - Status
4. Mark every current module as `unverified`, `partial`, `aligned`, or `needs refactor`.
5. Stop adding new features until the traceability matrix exists.

Deliverables:

- Source inventory
- Traceability matrix
- Phase status reset
- Gap list approved by project owner

Exit criteria:

- Every manual file and transcript requirement is represented in the traceability matrix.

---

## Phase B - Correct core domain architecture

Goal: create a workflow-first architecture.

Tasks:

1. Add shared workflow tables:
   - `workflow_definitions`
   - `workflow_steps`
   - `workflow_instances`
   - `workflow_instance_steps`
   - `workflow_actions`
   - `workflow_step_assignments`
   - `workflow_blockers`
   - `workflow_transition_logs`
2. Add approval tables:
   - `approval_requests`
   - `approval_decisions`
   - `approval_requirements`
3. Add document lifecycle tables:
   - `document_templates`
   - `generated_documents`
   - `generated_document_versions`
   - `document_number_sequences`
   - `document_attachments`
4. Add notification rules:
   - `notification_rules`
   - `notification_preferences`
   - `scheduled_reminder_runs`
5. Define base interfaces/services:
   - `WorkflowService`
   - `ApprovalService`
   - `DocumentNumberService`
   - `GeneratedDocumentService`
   - `ReminderSchedulerService`
   - `BranchScopeService`

Deliverables:

- Workflow schema
- Approval schema
- Document lifecycle schema
- Notification rule schema
- Shared services

Exit criteria:

- At least Reservation and Visa can create workflow instances with required steps.

---

## Phase C - Refactor authorization and branch scoping

Goal: remove hard-coded role logic from controllers.

Tasks:

1. Create policies for every major model.
2. Replace controller-local role arrays with policy calls.
3. Add `visibleTo(User $user)` scopes to operational models.
4. Normalize permission names in the seeder.
5. Fix permission naming mismatches such as `sales.set_monthly_target` vs `sales.set_targets`.
6. Add tests for each role and branch.
7. Confirm external accounting and Mariposa cannot log in.

Deliverables:

- Policies
- Permission naming map
- Authorization tests
- Branch visibility tests

Exit criteria:

- Tests prove each role can and cannot access expected pages/actions.

---

## Phase D - Refactor Reservation and Ormoc booking model

Goal: align booking/sales workflow with manual files.

Tasks:

1. Add missing Reservation fields or split into related tables.
2. Move agent codes to database.
3. Preserve negative income and explicit excess values.
4. Add passenger tracking.
5. Add airline and supplier/operator tracking.
6. Add FIT vs corporate/sub-agent workflow definitions.
7. Add purchase order lifecycle.
8. Add SOA/AR/SI/OR lifecycle.
9. Add accounting packet and audit document checklist.
10. Harmonize Ormoc and QC booking fields.
11. Convert Ormoc escalation/Mariposa fields into workflow steps.
12. Add automatic passport expiry flagging.
13. Add credit card surcharge as a financial line item.

Deliverables:

- Reservation/Ormoc migrations
- Updated models
- Updated forms
- Workflow definitions
- Seeded realistic samples
- Tests

Exit criteria:

- System can reproduce RESA and Ormoc sales monitoring columns.
- FIT and corporate/sub-agent flows behave differently where required.

---

## Phase E - Harden Visa workflow

Goal: make Visa an enforceable process, not just application records.

Tasks:

1. Add requirements checklist templates per visa/service type.
2. Add checklist completion records.
3. Add passport custody tracking.
4. Add embassy filing schedule.
5. Add liaison turnover and return proof.
6. Add payment request records.
7. Add embassy payment proof records.
8. Add OR endorsement records.
9. Add Admin Auditor/GM review step.
10. Add scheduled payment reminder job.
11. Add branch scoping through policy.

Deliverables:

- Visa workflow tables
- Visa workflow UI
- Scheduled reminders
- Tests

Exit criteria:

- Visa cannot proceed to final/audit-complete state without required checklist, payment, OR, and endorsement evidence.

---

## Phase F - Harden Finance modules

Goal: make AR, AP, Disbursement, Cashbond, Bills, Credit Card, and IATA enforce real finance controls.

Tasks:

1. Normalize payments into payment records.
2. Add approval workflows for AR and AP.
3. Add voucher lifecycle states.
4. Add attachment/evidence requirements.
5. Add due-date scheduler jobs.
6. Add cash/bank/access-file reconciliation.
7. Add operator/supplier proof emails.
8. Add audit check and JRT approval enforcement.
9. Add finance dashboard queues:
   - Due today
   - Overdue
   - Pending audit check
   - Pending JRT approval
   - Missing proof
   - Awaiting email confirmation
10. Add Excel/PDF exports for finance reports.

Deliverables:

- Finance workflow migrations
- Workflow UI actions
- Reminder jobs
- Export services
- Audit logging
- Tests

Exit criteria:

- No payment can be released without the required proof, audit, and approval states.

---

## Phase G - Rebuild BIR and document lifecycle

Goal: make documents generated, versioned, traceable, and reportable.

Tasks:

1. Add document template registry.
2. Add BIR form/template version review tracking.
3. Add generated document persistence.
4. Add document numbering service.
5. Add void/reissue rules.
6. Add monthly BIR report/export generation.
7. Add external accounting export package.
8. Add BIR monthly reminder job.
9. Add template-review reminder job.
10. Add access controls for document generation.

Deliverables:

- Template registry
- Generated document tables
- BIR export service
- Document tests

Exit criteria:

- AR/SI/SOA/CV/Check Voucher generation creates persisted, auditable document records.
- Monthly BIR package can be generated for external accounting.

---

## Phase H - Refactor HR and Attendance

Goal: match actual HR files and attendance control model.

Tasks:

1. Add missing employee fields.
2. Add leave ledger.
3. Add evaluation history.
4. Add salary adjustment history.
5. Add uniform issuance table.
6. Add employee document attachments.
7. Decide attendance mode: HR-controlled or employee-request-with-HR-approval.
8. If self-service remains, make entries pending until HR validation.
9. Add monthly attendance export.
10. Add HR/auditor access tests.

Deliverables:

- HR schema refactor
- Attendance control update
- Leave ledger
- HR exports
- Tests

Exit criteria:

- Employee Details manual file can be reproduced from the system.
- Attendance monthly report matches current manual tracking expectations.

---

## Phase I - Rebuild Marketing workflow

Goal: support campaign/research/approval/distribution/analytics, not just materials.

Tasks:

1. Add campaign model.
2. Add research items.
3. Add competitor/package/airline deal tracking.
4. Add material review workflow with COO approval.
5. Add revision requests.
6. Add itinerary distribution records.
7. Add paid ad spend and analytics snapshots.
8. Add email blast records.
9. Add testimonial and event tracking.
10. Add asset attachments.

Deliverables:

- Marketing campaign schema
- Review workflow
- Analytics UI
- Asset attachment handling
- Tests

Exit criteria:

- A marketing item can move from research to draft to COO approval to publishing/distribution to analytics review.

---

## Phase J - Rebuild Sales Summary to match the manual report

Goal: reproduce the exact management report, not a generic aggregator.

Tasks:

1. Inventory the current Sales Summary Excel structure.
2. Define agent grouping rules: RESA, GROUPS, Visa, Ormoc, etc.
3. Build Jan-Dec income matrix.
4. Build target vs achieved calculations.
5. Build cumulative target and cumulative achieved calculations.
6. Build QC total, Ormoc total, and Grand Total.
7. Add progress percentages and variance.
8. Add Excel export matching manual format.
9. Add PDF export if required.
10. Add report verification tests using known sample numbers.

Deliverables:

- New Sales Summary report builder
- Excel export
- PDF export if needed
- Sample verification test

Exit criteria:

- Management can compare the system export with the manual Excel report and see matching structure and totals.

---

## Phase K - Implement notification and scheduler system

Goal: make the system proactive.

Tasks:

1. Configure Laravel scheduler.
2. Add scheduled commands for all required due-date and threshold workflows.
3. Add in-app and email delivery rules.
4. Add escalation behavior.
5. Add notification preferences.
6. Add notification audit logs.
7. Add dashboard queues for urgent items.

Required commands:

- `visa:payment-reminders`
- `payables:due-reminders`
- `ar:aging-alerts`
- `cashbond:threshold-alerts`
- `bills:due-reminders`
- `credit-cards:due-reminders`
- `iata:payment-reminders`
- `bir:monthly-reminders`
- `bir:template-review-reminders`
- `disbursement:access-file-reminders`
- `marketing:review-reminders`

Deliverables:

- Scheduler commands
- Notification rules
- Email configuration
- Reminder tests

Exit criteria:

- Required reminders are triggered from real data, not manual actions only.

---

## Phase L - Data migration and reconciliation

Goal: make the system usable with actual historical files.

Tasks:

1. Inventory all Excel/Google Sheets/manual files.
2. Create import mapping per file.
3. Build import commands for each module.
4. Validate required fields.
5. Normalize agents, branches, suppliers, clients, and document numbers.
6. Detect duplicates.
7. Preserve original row reference/file reference.
8. Generate import error reports.
9. Reconcile totals against original spreadsheets.
10. Keep imported rows flagged as legacy imported data.

Deliverables:

- Import mapping docs
- Import commands
- Validation reports
- Reconciliation reports

Exit criteria:

- Real sample files can be imported and reconciled against source totals.

---

## Phase M - Testing and release readiness

Goal: prove correctness before demo/production.

Minimum tests:

1. Auth login and role assignment.
2. Branch isolation.
3. Reservation FIT workflow.
4. Reservation corporate/sub-agent workflow.
5. Visa payment request and OR workflow.
6. Ormoc domestic/international workflow.
7. AR approval workflow.
8. AP due/approval/payment workflow.
9. Disbursement voucher lifecycle.
10. Cashbond threshold workflow.
11. Bills due-date workflow.
12. Credit card due-date workflow.
13. IATA payment workflow.
14. BIR document generation and monthly report.
15. HR employee record completeness.
16. Attendance control model.
17. Marketing approval workflow.
18. Sales Summary report totals.
19. Notification scheduler.
20. Audit logging for sensitive actions.
21. Excel/PDF export correctness.

Deliverables:

- Feature tests
- Policy tests
- Report tests
- Import tests
- Smoke test script

Exit criteria:

- No module is marked aligned until tests prove alignment against the traceability matrix.

---

## 8. Proposed repository documentation structure

Add:

```text
docs/
  checkpoints/
    amkor-ims-alignment-checkpoint-2026-06-08.md
  requirements/
    source-inventory.md
    traceability-matrix.md
    manual-file-column-map.md
    role-permission-matrix.md
    workflow-state-definitions.md
  architecture/
    workflow-engine.md
    authorization-and-branch-scope.md
    document-generation-lifecycle.md
    notifications-and-scheduler.md
    data-import-strategy.md
  modules/
    reservation.md
    visa.md
    ormoc.md
    accounts-receivable.md
    accounts-payable.md
    disbursement.md
    cashbond.md
    bills-monitoring.md
    credit-card-monitoring.md
    iata-payments.md
    bir-compliance.md
    employee-records.md
    attendance.md
    marketing.md
    sales-summary.md
```

---

## 9. Immediate next actions

Recommended first PRs:

### PR 1 - Documentation checkpoint and traceability setup

- Add this checkpoint file.
- Add empty traceability matrix scaffold.
- Add source inventory scaffold.
- Add phase status reset note.

### PR 2 - RBAC cleanup foundation

- Normalize permission names.
- Add policies for Reservation, Visa, Ormoc, AR, AP, BIR, HR, Attendance, Marketing, Sales Summary.
- Add branch visibility tests.

### PR 3 - Workflow engine foundation

- Add workflow/approval/document lifecycle tables.
- Implement base workflow service.
- Connect Reservation and Visa first.

### PR 4 - Reservation data model correction

- Add missing RESA fields.
- Replace hard-coded agent codes with DB-backed agent table.
- Preserve negative income and explicit excess.
- Add passenger/supplier/document packet models.

### PR 5 - Sales Summary rebuild specification

- Create manual report shape spec.
- Replace generic aggregator with report-builder design.
- Add sample report tests.

### PR 6 - Notifications scheduler foundation

- Add scheduled commands and notification rule table.
- Implement Visa payment reminder and AP due reminder as first examples.

---

## 10. Final checkpoint decision

Do not continue treating the current implementation as Phase 12 complete.

The correct project posture is:

> Amkor IMS has a viable scaffold and several useful partial modules, but it must undergo a requirements-driven refactor before it can safely replace the company's manual workflow.

The next development cycle should prioritize correctness over preservation. If a current table, controller, route, or UI page conflicts with the transcript or actual Drive documents, the system should be broken and corrected now.

