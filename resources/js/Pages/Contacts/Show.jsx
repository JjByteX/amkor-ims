import { router, usePage } from '@inertiajs/react';
import AppShell from '../../Components/Layout/AppShell';
import DetailPanel, {
    PanelColumns, PanelCol, PanelColRight,
    PanelSection, PanelField, PanelFieldRow,
    PanelDivider, PanelMeta, PanelMetaItem,
} from '../../Components/Shared/DetailPanel';
import Badge from '../../Components/UI/Badge';
import { Building2, Users, Truck, Landmark } from 'lucide-react';

const TYPE_LABELS   = { corporate: 'Corporate Account', sub_agent: 'Sub-Agent', supplier: 'Supplier', bank: 'Bank' };
const TYPE_ICONS    = { corporate: Building2, sub_agent: Users, supplier: Truck, bank: Landmark };
const CCY_VARIANT   = { PHP: 'info', USD: 'success', JPY: 'warning' };

export function ContactContent({ contact }) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    return (
        <PanelColumns>
            <PanelCol>
                <PanelSection title="Contact Information">
                    <PanelField label="Contact Person" value={contact.contact_person} />
                    <PanelField label="Contact Number" value={contact.contact_number} />
                    <PanelField label="Email"          value={contact.email} />
                    <PanelField label="Address"        value={contact.address} />
                </PanelSection>
                <PanelDivider />
                <PanelSection title="Classification">
                    <PanelFieldRow>
                        <PanelField label="Type"     value={TYPE_LABELS[contact.type] ?? contact.type} />
                        <PanelField label="Currency" value={contact.currency} />
                    </PanelFieldRow>
                </PanelSection>
                <PanelMeta>
                    <PanelMetaItem label="Branch"   value={contact.branch?.name} />
                    <PanelMetaItem label="Added by" value={contact.created_by?.name} />
                    <PanelMetaItem label="Updated"  value={fmt(contact.updated_at)} />
                </PanelMeta>
            </PanelCol>
            <PanelColRight>
                <PanelSection title="Financial Details">
                    <PanelField label="TIN"            value={contact.tin} />
                    <PanelField label="Payment Terms"  value={contact.payment_terms} />
                    <PanelField label="Account Number" value={contact.account_number} mono />
                </PanelSection>
                {contact.notes && (
                    <>
                        <PanelDivider />
                        <PanelSection title="Notes">
                            <p className="font-body" style={{ fontSize: 'var(--font-size-small)', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                                {contact.notes}
                            </p>
                        </PanelSection>
                    </>
                )}
            </PanelColRight>
        </PanelColumns>
    );
}

export default function ContactShow({ contact, canWrite }) {
    const { url } = usePage();
    const isPanel = url?.includes('panel=1');
    const TypeIcon = TYPE_ICONS[contact.type] ?? Building2;

    if (isPanel) {
        return (
            <DetailPanel open onClose={() => router.visit(route('contacts.index', { type: contact.type }), { preserveState: false })}
                title={contact.name}
                subtitle={TYPE_LABELS[contact.type] ?? contact.type}
                editHref={canWrite ? route('contacts.edit', contact.id) : null}
                badges={<>
                    <Badge variant={contact.is_active ? 'success' : 'neutral'}>{contact.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant={CCY_VARIANT[contact.currency] ?? 'neutral'}>{contact.currency}</Badge>
                </>}
            >
                <ContactContent contact={contact} />
            </DetailPanel>
        );
    }
    return <AppShell><div style={{ padding: 'var(--space-3)' }}><ContactContent contact={contact} /></div></AppShell>;
}
