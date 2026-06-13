# Reservation/Show.jsx — Patch Instructions

Two small edits to `resources/js/Pages/Reservation/Show.jsx`.

---

## 1. Add the import

Find this import line:
```js
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
```

Add the new import immediately after it:
```js
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';
```

---

## 2. Add `relatedTransactions` to the component props

Find:
```js
export function BookingContent({ booking, statuses, serviceTypes, paymentModes, canWrite, contactsSearchUrl }) {
```

Change to:
```js
export function BookingContent({ booking, statuses, serviceTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
```

---

## 3. Render the panel after the Contact Link section

Find the Contact Link section block (ends with `</PanelSection>`):
```jsx
                <PanelSection title="Contact Link">
                    <ContactLinkPanel
                        contact={booking.contact}
                        contactsSearchUrl={contactsSearchUrl}
                        linkUrl={route('reservation.link-contact', booking.id)}
                        unlinkUrl={route('reservation.unlink-contact', booking.id)}
                        canLink={canWrite}
                    />
                </PanelSection>
```

Insert **immediately after** that closing `</PanelSection>` tag:
```jsx
                <RelatedTransactionsPanel transactions={relatedTransactions} />
```

---

## 4. Thread the prop through the default export

Find the default export function and its two usages of `BookingContent`:

```jsx
export default function ReservationShow({ booking, statuses, serviceTypes, paymentModes, canWrite, contactsSearchUrl }) {
```

Change to:
```jsx
export default function ReservationShow({ booking, statuses, serviceTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
```

Then both `<BookingContent ... />` calls inside it need the new prop. Find each one and add:
```jsx
relatedTransactions={relatedTransactions}
```

There are two — one inside the `isPanel` branch and one in the final `return`.
