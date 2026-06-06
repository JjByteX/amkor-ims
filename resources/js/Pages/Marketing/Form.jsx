import { useForm, router } from '@inertiajs/react';
import { Save, ArrowLeft } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import Card from '../../Components/UI/Card';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

// ── Field row helper ───────────────────────────────────────────────────────────

function FieldRow({ label, children, error }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {children}
            {error && (
                <span className="font-body" style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-error)' }}>
                    {error}
                </span>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MarketingForm({ material, materialTypes, platforms, mode }) {
    const isEdit = mode === 'edit';

    const { data, setData, post, put, processing, errors } = useForm({
        title:         material?.title ?? '',
        material_type: material?.material_type ?? '',
        description:   material?.description ?? '',
        platform:      material?.platform ?? '',
        caption:       material?.caption ?? '',
        publish_date:  material?.publish_date ?? '',
    });

    function handleSubmit() {
        if (isEdit) {
            put(route('marketing.update', material.id));
        } else {
            post(route('marketing.store'));
        }
    }

    const typeOptions = [
        { value: '', label: 'Select type…' },
        ...Object.entries(materialTypes).map(([v, l]) => ({ value: v, label: l })),
    ];

    const platformOptions = [
        { value: '', label: 'Select platform…' },
        ...Object.entries(platforms).map(([v, l]) => ({ value: v, label: l })),
    ];

    return (
        <AppShell>
            <div className="flex flex-col flex-1 min-h-0" style={{ gap: 'var(--space-section)' }}>

                <PageHeader
                    title={isEdit ? 'Edit Material' : 'New Material'}
                    subtitle={isEdit ? material.title : 'Create a marketing material'}
                    actions={
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => isEdit
                                ? router.get(route('marketing.show', material.id))
                                : router.get(route('marketing.index'))
                            }
                        >
                            Back
                        </Button>
                    }
                />

                <Card>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>

                        {/* Title */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FieldRow label="Title" error={errors.title}>
                                <Input
                                    label="Title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    error={errors.title}
                                    placeholder="e.g. Japan Summer 2026 Poster"
                                />
                            </FieldRow>
                        </div>

                        {/* Type */}
                        <FieldRow label="Material Type" error={errors.material_type}>
                            <Select
                                label="Material Type"
                                options={typeOptions}
                                value={data.material_type}
                                onChange={(e) => setData('material_type', e.target.value)}
                                error={errors.material_type}
                            />
                        </FieldRow>

                        {/* Platform */}
                        <FieldRow label="Platform" error={errors.platform}>
                            <Select
                                label="Platform"
                                options={platformOptions}
                                value={data.platform}
                                onChange={(e) => setData('platform', e.target.value)}
                                error={errors.platform}
                            />
                        </FieldRow>

                        {/* Publish date */}
                        <FieldRow label="Target Publish Date" error={errors.publish_date}>
                            <Input
                                label="Target Publish Date"
                                type="date"
                                value={data.publish_date}
                                onChange={(e) => setData('publish_date', e.target.value)}
                                error={errors.publish_date}
                            />
                        </FieldRow>

                        {/* Description */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FieldRow label="Description / Brief" error={errors.description}>
                                <Textarea
                                    label="Description / Brief"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    error={errors.description}
                                    rows={3}
                                    placeholder="What is this material about? Include key information or design brief."
                                />
                            </FieldRow>
                        </div>

                        {/* Caption */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FieldRow label="Caption / Post Copy" error={errors.caption}>
                                <Textarea
                                    label="Caption / Post Copy"
                                    value={data.caption}
                                    onChange={(e) => setData('caption', e.target.value)}
                                    error={errors.caption}
                                    rows={4}
                                    placeholder="Caption or post copy for social media, email, etc."
                                />
                            </FieldRow>
                        </div>

                        {/* Actions */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)', paddingTop: 'var(--space-1)', borderTop: 'var(--border-container)' }}>
                            <Button
                                variant="ghost"
                                onClick={() => isEdit
                                    ? router.get(route('marketing.show', material.id))
                                    : router.get(route('marketing.index'))
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                icon={Save}
                                loading={processing}
                                onClick={handleSubmit}
                            >
                                {isEdit ? 'Save Changes' : 'Create Material'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </AppShell>
    );
}
