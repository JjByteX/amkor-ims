import { router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Building2, Users, Truck, Landmark, Mail, Phone, MapPin, CreditCard, FileText, User } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Badge from '../../Components/UI/Badge';
import Button from '../../Components/UI/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
    corporate : Building2,
    sub_agent : Users,
    supplier  : Truck,
    bank      : Landmark,
};

const TYPE_LABELS = {
    corporate : 'Corporate Account',
    sub_agent : 'Sub-Agent / Travel Agency',
    supplier  : 'Supplier / Operator',
    bank      : 'Bank',
};

const CURRENCY_VARIANT = { PHP: 'info', USD: 'success', JPY: 'warning' };

function DetailRow({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span className="shrink-0 mt-0.5 text-gray-400">
                <Icon size={15} />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span
                    className="font-body font-semibold text-gray-400 uppercase tracking-wide"
                    style={{ fontSize: '11px' }}
                >
                    {label}
                </span>
                <span
                    className="font-body text-[var(--color-text)] break-words"
                    style={{ fontSize: 'var(--font-size-small)' }}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

function ContactShow({ contact, canWrite }) {
    const TypeIcon  = TYPE_ICONS[contact.type]  ?? Building2;
    const typeLabel = TYPE_LABELS[contact.type] ?? contact.type;

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <PageHeader
                title={contact.name}
                subtitle={typeLabel}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => router.get(route('contacts.index', { type: contact.type }))}
                        >
                            Back
                        </Button>
                        {canWrite && (
                            <Button
                                variant="secondary"
                                icon={Pencil}
                                onClick={() => router.get(route('contacts.edit', contact.id))}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                }
            />

            <Card>
                {/* Header row — type badge, status, currency */}
                <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
                    <span className="flex items-center gap-2 text-[var(--color-primary)]">
                        <TypeIcon size={20} />
                        <span
                            className="font-heading font-semibold text-[var(--color-text)]"
                            style={{ fontSize: 'var(--font-size-heading)' }}
                        >
                            {contact.name}
                        </span>
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <Badge variant={contact.is_active ? 'success' : 'neutral'}>
                            {contact.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={CURRENCY_VARIANT[contact.currency] ?? 'neutral'}>
                            {contact.currency}
                        </Badge>
                    </div>
                </div>

                {/* Detail rows */}
                <div className="flex flex-col">
                    <DetailRow icon={User}      label="Contact Person"  value={contact.contact_person}  />
                    <DetailRow icon={Phone}     label="Contact Number"  value={contact.contact_number}  />
                    <DetailRow icon={Mail}      label="Email"           value={contact.email}           />
                    <DetailRow icon={MapPin}    label="Address"         value={contact.address}         />
                    <DetailRow icon={FileText}  label="TIN"             value={contact.tin}             />
                    <DetailRow icon={CreditCard} label="Payment Terms"  value={contact.payment_terms}   />
                    <DetailRow icon={CreditCard} label="Account Number" value={contact.account_number}  />
                    <DetailRow icon={FileText}  label="Notes"           value={contact.notes}           />
                </div>

                {/* Audit trail footer */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4">
                    {contact.branch && (
                        <span className="font-body text-gray-400" style={{ fontSize: '11px' }}>
                            <span className="font-semibold uppercase tracking-wide">Branch:</span>{' '}
                            {contact.branch.name}
                        </span>
                    )}
                    {contact.created_by && (
                        <span className="font-body text-gray-400" style={{ fontSize: '11px' }}>
                            <span className="font-semibold uppercase tracking-wide">Added by:</span>{' '}
                            {contact.created_by.name}
                        </span>
                    )}
                    {contact.updated_at && (
                        <span className="font-body text-gray-400" style={{ fontSize: '11px' }}>
                            <span className="font-semibold uppercase tracking-wide">Last updated:</span>{' '}
                            {new Date(contact.updated_at).toLocaleDateString('en-PH', {
                                year: 'numeric', month: 'short', day: 'numeric',
                            })}
                        </span>
                    )}
                </div>
            </Card>

            {/* Transaction history placeholder — populated in later phases */}
            <Card>
                <p
                    className="font-body text-gray-400 text-center py-4"
                    style={{ fontSize: 'var(--font-size-small)' }}
                >
                    Transaction history will appear here once booking and financial modules are active.
                </p>
            </Card>
        </div>
    );
}

ContactShow.layout = (page) => <AppShell>{page}</AppShell>;
export default ContactShow;
