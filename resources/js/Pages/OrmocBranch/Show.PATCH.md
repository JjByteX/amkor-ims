# OrmocBranch/Show.jsx — Patch Instructions

Three small edits to `resources/js/Pages/OrmocBranch/Show.jsx`.

---

## 1. Add the import

Find:
```js
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
```

Add immediately after:
```js
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';
```

---

## 2. Add `relatedTransactions` to the component props

Find:
```js
export function OrmocContent({ booking, statuses, bookingTypes, paymentModes, canWrite, contactsSearchUrl }) {
```

Change to:
```js
export function OrmocContent({ booking, statuses, bookingTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
```

---

## 3. Render the panel after the Contact Link section

Find the Contact Link section (on the RIGHT column):
```jsx
                <PanelSection title="Contact Link">
                    <ContactLinkPanel
                        contact={booking.contact}
                        contactsSearchUrl={contactsSearchUrl}
                        linkUrl={route('ormoc.link-contact', booking.id)}
                        unlinkUrl={route('ormoc.unlink-contact', booking.id)}
                        canLink={canWrite}
                    />
                </PanelSection>
```

Insert **immediately after** that closing `</PanelSection>`:
```jsx
                <RelatedTransactionsPanel transactions={relatedTransactions} />
```

---

## 4. Thread the prop through the default export

Find:
```jsx
export default function OrmocBranchShow({ booking, statuses, bookingTypes, paymentModes, canWrite, contactsSearchUrl }) {
```

Change to:
```jsx
export default function OrmocBranchShow({ booking, statuses, bookingTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
```

Then add `relatedTransactions={relatedTransactions}` to both `<OrmocContent ... />` calls inside it.
