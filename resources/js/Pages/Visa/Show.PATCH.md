# Visa/Show.jsx — Patch Instructions

Three small edits to `resources/js/Pages/Visa/Show.jsx`.

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
export function VisaContent({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl }) {
```

Change to:
```js
export function VisaContent({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl, relatedTransactions }) {
```

---

## 3. Render the panel after the Contact Link section

Find the Contact Link section (on the LEFT column):
```jsx
                    <PanelSection title="Contact Link">
                        <ContactLinkPanel
                            contact={application.contact}
                            contactsSearchUrl={contactsSearchUrl}
                            linkUrl={route('visa.link-contact', application.id)}
                            unlinkUrl={route('visa.unlink-contact', application.id)}
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
export default function VisaShow({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl }) {
```

Change to:
```jsx
export default function VisaShow({ application, statuses, paymentModes, canWrite, canEndorse, contactsSearchUrl, relatedTransactions }) {
```

Then add `relatedTransactions={relatedTransactions}` to both `<VisaContent ... />` calls inside it.
