import { router, useForm, usePage } from '@inertiajs/react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {
    PanelColumns, PanelCol, PanelColRight,
    PanelSection, PanelField, PanelFieldRow,
    PanelDivider, PanelMeta, PanelMetaItem, PanelActions,
} from '../../Components/Shared/DetailPanel';
import Badge from '../../Components/UI/Badge';
import Button from '../../Components/UI/Button';
import Select from '../../Components/UI/Select';
import ContactLinkPanel from '../../Components/Shared/ContactLinkPanel';
import RelatedTransactionsPanel from '../../Components/Shared/RelatedTransactionsPanel';
import { Send } from 'lucide-react';

const STATUS_VARIANT = { inquiry: 'neutral', quoted: 'info', confirmed: 'success', cancelled: 'error' };
const money   = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v ?? 0));
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

export function BookingContent({ booking, statuses, serviceTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
    const statusForm = useForm({ status: booking.status });
    function changeStatus(e) {
        router.post(route('reservation.status', booking.id), { status: e.target.value }, { preserveScroll: true });
    }
    return (
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Booking Details">
                    <PanelFieldRow>
                        <PanelField label="Date"   value={fmtDate(booking.date)} />
                        <PanelField label="Branch" value={booking.branch?.name} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Agent Code" value={booking.agent_code} highlight />
                        <PanelField label="Service"    value={serviceTypes[booking.service_type] ?? booking.service_type} />
                    </PanelFieldRow>
                    <PanelField label="Destination" value={booking.destination} />
                    <PanelFieldRow>
                        <PanelField label="Travel Date" value={fmtDate(booking.travel_date)} />
                        <PanelField label="Return Date" value={fmtDate(booking.return_date)} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Pax Count"         value={booking.pax_count} />
                        <PanelField label="Corporate Account" value={booking.corporate_account} />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="Contact Number" value={booking.contact_number} />
                        <PanelField label="Email"          value={booking.email} />
                    </PanelFieldRow>
                </PanelSection>
                <PanelDivider />
                <PanelSection title="Document References">
                    <PanelFieldRow>
                        <PanelField label="SOA #" value={booking.soa_number} mono />
                        <PanelField label="PO #"  value={booking.po_number}  mono />
                    </PanelFieldRow>
                    <PanelFieldRow>
                        <PanelField label="SI #" value={booking.si_number} mono />
                        <PanelField label="AR #" value={booking.ar_number} mono />
                    </PanelFieldRow>
                    <PanelField label="OR #" value={booking.or_number} mono />
                </PanelSection>
                <PanelMeta>
                    <PanelMetaItem label="Booking #" value={booking.booking_no} />
                </PanelMeta>
            </PanelCol>
            <PanelColRight>
                <PanelSection title="Financials">
                    <PanelField label="Selling Price" value={money(booking.selling_price)} highlight />
                    <PanelField label="Net Payable"   value={money(booking.net_payable)} />
                    <PanelField label="Income"        value={money(booking.income)} />
                    <PanelDivider />
                    <PanelField label="Payment Mode" value={paymentModes[booking.mode_of_payment] ?? booking.mode_of_payment} />
                    <PanelField label="Payment Due"  value={fmtDate(booking.payment_due_date)} />
                </PanelSection>
                <PanelDivider />
                <PanelSection title="Contact Link">
                    <ContactLinkPanel
                        contact={booking.contact}
                        contactsSearchUrl={contactsSearchUrl}
                        linkUrl={route('reservation.link-contact', booking.id)}
                        unlinkUrl={route('reservation.unlink-contact', booking.id)}
                        canLink={canWrite}
                    />
                </PanelSection>
                <RelatedTransactionsPanel transactions={relatedTransactions} />
                {(booking.particulars || booking.remarks || booking.inclusions || booking.exclusions) && (<>
                    <PanelDivider />
                    <PanelSection title="Notes & Coverage">
                        {booking.particulars && <PanelField label="Particulars" value={booking.particulars} />}
                        {booking.remarks     && <PanelField label="Remarks"     value={booking.remarks} />}
                        {booking.inclusions  && <PanelField label="Inclusions"  value={booking.inclusions} />}
                        {booking.exclusions  && <PanelField label="Exclusions"  value={booking.exclusions} />}
                    </PanelSection>
                </>)}
                {canWrite && (<>
                    <PanelDivider />
                    <PanelSection title="Actions">
                        <Select label="Update Status" value={statusForm.data.status} onChange={changeStatus}
                            options={Object.entries(statuses).map(([v, l]) => ({ value: v, label: l }))} />
                        {!booking.forwarded_to_accounting && booking.status === 'confirmed' && (
                            <Button icon={Send} onClick={() => router.post(route('reservation.forward-accounting', booking.id), {}, { preserveScroll: true })} style={{ width: '100%' }}>
                                Forward to Accounting
                            </Button>
                        )}
                    </PanelSection>
                </>)}
            </PanelColRight>
        </PanelColumns>
    );
}

export default function ReservationShow({ booking, statuses, serviceTypes, paymentModes, canWrite, contactsSearchUrl, relatedTransactions }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');
    if (isPanel) {
        return (
            <DetailPanel open onClose={() => router.visit(route('reservation.index'), { preserveState: false })}
                title={booking.booking_no} subtitle={booking.client_name}
                badges={<>
                    <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>{statuses[booking.status] ?? booking.status}</Badge>
                    {booking.forwarded_to_accounting && <Badge variant="success">Forwarded to Accounting</Badge>}
                </>}
            >
                <BookingContent booking={booking} statuses={statuses} serviceTypes={serviceTypes} paymentModes={paymentModes} canWrite={canWrite} contactsSearchUrl={contactsSearchUrl} relatedTransactions={relatedTransactions} />
            </DetailPanel>
        );
    }
    return <AppShell><BookingContent booking={booking} statuses={statuses} serviceTypes={serviceTypes} paymentModes={paymentModes} canWrite={canWrite} contactsSearchUrl={contactsSearchUrl} relatedTransactions={relatedTransactions} /></AppShell>;
}
