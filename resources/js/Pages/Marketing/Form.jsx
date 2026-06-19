import { useForm, router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import { FormLayout, FormCard, FormRow, FormActions } from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';

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

    function handleSubmit(e) {
        e.preventDefault();
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
            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                <FormLayout>
                    <PageHeader
                        breadcrumb={[{ label: 'Marketing', href: route('marketing.index') }]}
                        title={isEdit ? 'Edit Material' : 'New Material'}
                        subtitle={isEdit ? material.title : 'Create a marketing material'}
                        actions={
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    icon={X}
                                    onClick={() => router.get(route('marketing.index'))}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" icon={Save} loading={processing}>
                                    {isEdit ? 'Save Changes' : 'Create Material'}
                                </Button>
                            </>
                        }
                    />

                    <FormCard title="Material Details">
                        <Input label="Title" value={data.title} onChange={(e) => setData('title', e.target.value)} error={errors.title} placeholder="e.g. Japan Summer 2026 Poster" />
                        <FormRow>
                            <Select label="Material Type" options={typeOptions} value={data.material_type} onChange={(e) => setData('material_type', e.target.value)} error={errors.material_type} />
                            <Select label="Platform" options={platformOptions} value={data.platform} onChange={(e) => setData('platform', e.target.value)} error={errors.platform} />
                        </FormRow>
                        <Input label="Target Publish Date" type="date" value={data.publish_date} onChange={(e) => setData('publish_date', e.target.value)} error={errors.publish_date} />
                        <Textarea label="Description / Brief" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} rows={3} placeholder="What is this material about? Include key information or design brief." />
                        <Textarea label="Caption / Post Copy" value={data.caption} onChange={(e) => setData('caption', e.target.value)} error={errors.caption} rows={4} placeholder="Caption or post copy for social media, email, etc." />
                    </FormCard>

                    <FormActions>
                        <Button type="button" variant="ghost" icon={X} onClick={() => router.get(route('marketing.index'))}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={Save} loading={processing}>
                            {isEdit ? 'Save Changes' : 'Create Material'}
                        </Button>
                    </FormActions>
                </FormLayout>
            </form>
        </AppShell>
    );
}
