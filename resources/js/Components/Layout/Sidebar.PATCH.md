# Sidebar.jsx — Patch Instructions

Two changes are needed to register Airline Rates in the sidebar navigation.

---

## 1. Add `Ticket` to the lucide-react import

Find this line near the top of `Sidebar.jsx`:

```js
    PlaneTakeoff, FileCheck2, MapPinned,
```

Change it to:

```js
    PlaneTakeoff, FileCheck2, MapPinned, Ticket,
```

---

## 2. Insert the nav item after `reservation-sales`

Find the `reservation-sales` nav item block:

```js
            {
                key  : 'reservation-sales',
                href : '/reservation/sales-report',
                icon : <ChartNoAxesCombined size={20} />,
                label: 'RESA Sales Report',
                roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'admin_auditor', 'resa_officer', 'ormoc_branch_officer'],
            },
```

Insert the following **immediately after** that closing `},` (before the `visa` item):

```js
            {
                key  : 'airline-rates',
                href : '/airline-rates',
                icon : <Ticket size={20} />,
                label: 'Airline Rates',
                roles: ['general_manager', 'chief_operations_officer', 'general_sales_manager', 'accounting_officer', 'resa_officer', 'ormoc_branch_officer', 'admin_auditor', 'visa_documentation_officer'],
            },
```

---

That's the complete sidebar change — one word added to the import, one new object in the nav array.
