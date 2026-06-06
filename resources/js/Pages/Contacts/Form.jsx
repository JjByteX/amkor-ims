import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import Checkbox from '../../Components/UI/Checkbox';

// Fields that are only shown for specific contact types
const TYPE_FIELD_MAP = {
    corporate : ['tin', 'address', 'contact_person', 'contact_number', 'email', 'payment_terms', 'currency', 'notes'],
    sub_agent : ['tin', 'address', 'contact_person', 'contact_number', 'email', 'payment_terms', 'currency', 'notes'],
    supplier  : ['tin', 'address', 'contact_person', 'contact_number', 'email', 'payment_terms', 'currency', 'notes'],
    bank      : ['currency', 'account_number', 'notes'],
};

function ContactForm({ contact, types, currencies, defaultType }) {
    const isEditing = !!contact;

    const { data, setData, post, put, processing, errors } = useForm({
        type           : contact?.type           ?? defaultType ?? 'corporate',
        name           : contact?.name           ?? '',
        tin            : contact?.tin            ?? '',
        address        : contact?.address        ?? '',
        contact_person : contact?.contact_person ?? '',
        contact_number : contact?.contact_number ?? '',
        email          : contact?.email          ?? '',
        payment_terms  : contact?.payment_terms  ?? '',
        currency       : contact?.currency       ?? 'PHP',
        account_number : contact?.account_number ?? '',
        notes          : contact?.notes          ?? '',
        is_active      : contact?.is_active      ?? true,
    });

    const visibleFields = TYPE_FIELD_MAP[data.type] ?? Object.keys(TYPE_FIELD_MAP.corporate);

    function show(field) {
        return visibleFields.includes(field);
    }

    function submit(e) {
        e.preventDefault();
        if (isEditing) {
            put(route('contacts.update', contact.id));
        } else {
            post(route('contacts.store'));
        }
    }

    const typeOptions = Object.entries(types).map(([value, label]) => ({ value, label }));
    const currencyOptions = currencies.map((c) => ({ value: c, label: c }));

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <PageHeader
                title={isEditing ? `Edit: ${contact.name}` : 'Add Contact'}
                subtitle={isEditing ? 'Update contact details.' : 'Add a new contact to the directory.'}
                actions={
                    <Button
                        variant="ghost"
                        icon={ArrowLeft}
                        onClick={() =>
                            router.get(
                                isEditing
                                    ? route('contacts.show', contact.id)
                                    : route('contacts.index', { type: data.type })
                            )
                        }
                    >
                        Back
                    </Button>
                }
            />

            <Card>
                <form onSubmit={submit} className="flex flex-col gap-5">
                    {/* Type — always visible, drives which fields render */}
                    <Select
                        label="Contact Type"
                        options={typeOptions}
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        error={errors.type}
                        required
                        disabled={isEditing} // type cannot be changed after creation
                    />

                    {/* Name — always visible */}
                    <Input
                        label="Name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        required
                        placeholder={data.type === 'bank' ? 'e.g. BDO Unibank' : 'Full company or agency name'}
                    />

                    {/* Corporate / Sub-agent / Supplier fields */}
                    {show('tin') && (
                        <Input
                            label="TIN"
                            value={data.tin}
                            onChange={(e) => setData('tin', e.target.value)}
                            error={errors.tin}
                            placeholder="e.g. 123-456-789-000"
                        />
                    )}

                    {show('contact_person') && (
                        <Input
                            label="Contact Person"
                            value={data.contact_person}
                            onChange={(e) => setData('contact_person', e.target.value)}
                            error={errors.contact_person}
                            placeholder="Primary contact name"
                        />
                    )}

                    {show('contact_number') && (
                        <Input
                            label="Contact Number"
                            value={data.contact_number}
                            onChange={(e) => setData('contact_number', e.target.value)}
                            error={errors.contact_number}
                            placeholder="e.g. +63 917 000 0000"
                        />
                    )}

                    {show('email') && (
                        <Input
                            label="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            placeholder="email@company.com"
                        />
                    )}

                    {show('address') && (
                        <Textarea
                            label="Address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            error={errors.address}
                            rows={2}
                            placeholder="Full business address"
                        />
                    )}

                    {show('payment_terms') && (
                        <Input
                            label="Payment Terms"
                            value={data.payment_terms}
                            onChange={(e) => setData('payment_terms', e.target.value)}
                            error={errors.payment_terms}
                            placeholder="e.g. Net 30, Upon receipt"
                        />
                    )}

                    {/* Currency — shown for all types */}
                    {show('currency') && (
                        <Select
                            label="Currency"
                            options={currencyOptions}
                            value={data.currency}
                            onChange={(e) => setData('currency', e.target.value)}
                            error={errors.currency}
                        />
                    )}

                    {/* Bank account number — bank type only */}
                    {show('account_number') && (
                        <Input
                            label="Account Number"
                            value={data.account_number}
                            onChange={(e) => setData('account_number', e.target.value)}
                            error={errors.account_number}
                            placeholder="e.g. 0002-7006-7663"
                        />
                    )}

                    {show('notes') && (
                        <Textarea
                            label="Notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            error={errors.notes}
                            rows={3}
                            placeholder="Any additional notes or instructions"
                        />
                    )}

                    {/* Active toggle — always visible on edit */}
                    {isEditing && (
                        <Checkbox
                            label="Active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                        />
                    )}

                    {/* Submit */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={processing}
                        >
                            {isEditing ? 'Save Changes' : 'Add Contact'}
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={processing}
                            onClick={() =>
                                router.get(
                                    isEditing
                                        ? route('contacts.show', contact.id)
                                        : route('contacts.index', { type: data.type })
                                )
                            }
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

ContactForm.layout = (page) => <AppShell>{page}</AppShell>;
export default ContactForm;
