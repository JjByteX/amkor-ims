import { useState, useEffect, useRef } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppShell from '../../Components/Layout/AppShell';
import PageHeader from '../../Components/Shared/PageHeader';
import {
    FormCard, FormRow,
    FormCancelButton, FormSubmitButton,
} from '../../Components/Shared/FormLayout';
import Button from '../../Components/UI/Button';
import FormStepper from '../../Components/Shared/FormStepper';
import Input from '../../Components/UI/Input';
import Select from '../../Components/UI/Select';
import Textarea from '../../Components/UI/Textarea';
import useExchangeRate from '../../hooks/useExchangeRate';

const today = () => new Date().toISOString().slice(0, 10);

// ─── Tour package helpers ──────────────────────────────────────────────────────

function detectPricingModel(tourCosts) {
    if (!tourCosts || tourCosts.length === 0) return null;
    return tourCosts.some((t) => t.type) ? 'room_type' : 'pax';
}

function priceForPax(tourCosts, paxCount) {
    if (!tourCosts || tourCosts.length === 0) return null;
    let applicable = null;
    for (const tier of tourCosts) {
        if (paxCount >= Number(tier.min_pax ?? 0)) applicable = Number(tier.price);
    }
    return applicable;
}

function priceForRoomType(tourCosts, roomType) {
    if (!tourCosts || !roomType) return null;
    const match = tourCosts.find((t) => t.type === roomType);
    return match ? Number(match.price) : null;
}

function computePhpPrice(usdPrice, surcharge, exchangeRate) {
    const p = parseFloat(usdPrice);
    const s = parseFloat(surcharge ?? 0);
    const r = parseFloat(exchangeRate);
    if (isNaN(p) || isNaN(r)) return '';
    return ((p + s) * r).toFixed(2);
}

function computeUsdPrice(usdPrice, surcharge) {
    const p = parseFloat(usdPrice);
    const s = parseFloat(surcharge ?? 0);
    if (isNaN(p)) return '';
    return (p + s).toFixed(2);
}

function firstUpcomingDeparture(departureDates) {
    if (!departureDates || departureDates.length === 0) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    return departureDates.find((d) => d.date >= todayStr) ?? null;
}

/**
 * Compute return date from travel date + duration days.
 * Returns YYYY-MM-DD string or null if inputs are invalid.
 */
function computeReturnDate(travelDate, durationDays) {
    if (!travelDate || !durationDays) return null;
    const d = new Date(travelDate + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + Number(durationDays) - 1);
    return d.toISOString().slice(0, 10);
}

/**
 * Compute payment due date as travel_date − 30 days.
 * Returns YYYY-MM-DD string or null if travelDate is invalid.
 */
function computePaymentDueDate(travelDate) {
    if (!travelDate) return null;
    const d = new Date(travelDate + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}

/**
 * Get the minimum pax requirement for a package.
 * For pax-tier packages: lowest min_pax value.
 * For room-type packages: no pax minimum (returns null).
 */
function getMinPax(tourCosts) {
    if (!tourCosts || tourCosts.length === 0) return null;
    if (tourCosts.some((t) => t.type)) return null; // room-type — no pax rule
    const vals = tourCosts.map((t) => Number(t.min_pax)).filter((n) => !isNaN(n));
    return vals.length ? Math.min(...vals) : null;
}

// ─── PackageReadOnlyField — shows a locked value with a "from package" badge ──

function PackageReadOnlyField({ label, value, multiline = false }) {
    const textStyle = {
        fontSize      : 'var(--font-size-body)',
        fontFamily    : 'var(--font-body)',
        color         : 'var(--color-text)',
        background    : 'var(--color-surface)',
        border        : 'var(--border-container)',
        borderRadius  : 'var(--radius-md)',
        padding       : 'var(--space-1) var(--space-2)',
        whiteSpace    : multiline ? 'pre-line' : 'normal',
        lineHeight    : 1.6,
        opacity       : 0.85,
        minHeight     : multiline ? 72 : 'var(--height-input)',
        display       : 'flex',
        alignItems    : multiline ? 'flex-start' : 'center',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                    fontSize   : 'var(--font-size-small)',
                    fontFamily : 'var(--font-body)',
                    fontWeight : 'var(--font-weight-semibold)',
                    color      : 'var(--color-text)',
                }}>
                    {label}
                </span>
                <span style={{
                    fontSize     : 'calc(var(--font-size-small) - 1px)',
                    fontFamily   : 'var(--font-body)',
                    fontWeight   : 600,
                    color        : 'var(--color-primary)',
                    background   : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                    borderRadius : 'var(--radius-sm)',
                    padding      : '1px 7px',
                }}>
                    from package
                </span>
            </div>
            <div style={textStyle}>
                {value || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
            </div>
        </div>
    );
}



// ─── Main component ────────────────────────────────────────────────────────────

/**
 * ReservationForm — create/edit form for ALL branches (QC and Ormoc).
 *
 * Structured as 3 pages navigable by clicking tabs at the top:
 *   Page 1 — Booking Basics  : who is booking, service type, pax count
 *   Page 2 — Trip Details    : package/airline/destination/dates + (QC) particulars/inclusions/exclusions
 *                              Uses a wide two-column layout for QC to cut vertical height.
 *   Page 3 — Financials      : selling price, payment, reference numbers
 *
 * Tabs are always clickable — no locked wizard sequence.
 * Submit button is always visible in the header and at the bottom of each page.
 *
 * MODE A — No package selected (service_type !== 'package', or FIT/custom):
 *   All trip fields are editable free-text, identical to the original form.
 *
 * MODE B — Package selected (service_type === 'package' and a package is chosen):
 *   Staff configure: package, departure date, room type (if applicable),
 *   pax count, currency, exchange rate.
 *   The following are locked as read-only display (cannot be typed):
 *     - destination     (from package.destinations)
 *     - travel_date     (driven by departure date selector)
 *     - particulars     (from package.particulars)
 *     - inclusions      (from package.inclusions)
 *     - exclusions      (from package.exclusions)
 *     - selling_price   (computed: tier + surcharge × rate) — read-only but visible
 *   "Change package" button in the panel is the only way to modify these.
 *
 * Ormoc branch: same MODE B applies but only destination + travel_date are
 * locked (particulars/inclusions/exclusions are not rendered for Ormoc).
 */
export default function ReservationForm({
    booking,
    statuses,
    serviceTypes,
    bookingTypes,
    transactionTypes,
    paymentModes,
    agentCodes,
    isOrmocBranch,
    contactsSearchUrl,
    tourPackageSearchUrl,
    airlineRateSearchUrl,
}) {
    const isEdit = Boolean(booking);

    const { data, setData, post, put, processing, errors } = useForm({
        date              : booking?.date               ?? today(),
        agent_code        : booking?.agent_code         ?? '',
        status            : booking?.status             ?? 'inquiry',
        service_type      : booking?.service_type       ?? 'package',
        transaction_type  : booking?.transaction_type   ?? '',
        booking_type      : booking?.booking_type       ?? 'domestic',
        client_name       : booking?.client_name        ?? '',
        contact_person    : booking?.contact_person     ?? '',
        date_of_birth     : booking?.date_of_birth      ?? '',
        contact_number    : booking?.contact_number     ?? '',
        email             : booking?.email              ?? '',
        corporate_account : booking?.corporate_account  ?? '',
        destination       : booking?.destination        ?? '',
        airline           : booking?.airline            ?? '',
        travel_date       : booking?.travel_date        ?? '',
        return_date       : booking?.return_date        ?? '',
        pax_count         : booking?.pax_count          ?? 1,
        hotel             : booking?.hotel              ?? '',
        room_type         : booking?.room_type          ?? '',
        flight_details    : booking?.flight_details     ?? '',
        particulars       : booking?.particulars        ?? '',
        inclusions        : booking?.inclusions         ?? '',
        exclusions        : booking?.exclusions         ?? '',
        source            : booking?.source             ?? '',
        passport_expiry   : booking?.passport_expiry    ?? '',
        selling_price     : booking?.selling_price      ?? '',
        currency          : booking?.currency           ?? 'PHP',
        net_payable       : booking?.net_payable        ?? '',
        income            : booking?.income             ?? '',
        excess            : booking?.excess             ?? '',
        insurance_nett    : booking?.insurance_nett     ?? '',
        acr               : booking?.acr                ?? '',
        mode_of_payment   : booking?.mode_of_payment    ?? '',
        payment_due_date  : booking?.payment_due_date   ?? '',
        date_of_payment   : booking?.date_of_payment    ?? '',
        soa_number        : booking?.soa_number         ?? '',
        po_number         : booking?.po_number          ?? '',
        si_number         : booking?.si_number          ?? '',
        ar_number         : booking?.ar_number          ?? '',
        or_number         : booking?.or_number          ?? '',
        remarks           : booking?.remarks            ?? '',
        audit_remarks     : booking?.audit_remarks      ?? '',
        notes             : booking?.notes              ?? '',
    });

    // ── Page state ─────────────────────────────────────────────────────────────

    const [currentPage, setCurrentPage] = useState(1);

    // ── Tour package state ─────────────────────────────────────────────────────

    const [selectedPackage,   setSelectedPackage]   = useState(null);
    const [packageOptions,    setPackageOptions]    = useState([]);
    const [packageSearching,  setPackageSearching]  = useState(false);
    const [exchangeRate,      setExchangeRate]      = useState('');
    const [selectedRoomType,  setSelectedRoomType]  = useState('');
    const [selectedDeparture, setSelectedDeparture] = useState(null);

    // ── Airline rate state (ticketing bookings only) ───────────────────────────
    const [airlineRateOptions,   setAirlineRateOptions]   = useState([]);
    const [airlineRateSearching, setAirlineRateSearching] = useState(false);

    const { rate: liveRate, error: rateError } = useExchangeRate();

    // Pre-fill exchange rate once live rate arrives
    useEffect(() => {
        if (liveRate && !exchangeRate) setExchangeRate(String(liveRate));
    }, [liveRate]);

    // Derived flags
    const packageMode      = data.service_type === 'package' && Boolean(selectedPackage);
    const showPkgSelector  = data.service_type === 'package';
    const showTicketing    = data.service_type === 'ticketing'; // airline rate dropdown applies here
    const pricingModel     = detectPricingModel(selectedPackage?.tour_costs);
    const isRoomType       = pricingModel === 'room_type';
    const isPax            = pricingModel === 'pax';
    const showExchangeRate = packageMode && data.currency === 'PHP';

    // ── Auto-recalculate selling_price ─────────────────────────────────────────

    useEffect(() => {
        if (!selectedPackage) return;

        const surcharge = selectedDeparture?.surcharge ?? 0;
        let usdPrice = null;

        if (isRoomType) usdPrice = priceForRoomType(selectedPackage.tour_costs, selectedRoomType);
        else if (isPax)  usdPrice = priceForPax(selectedPackage.tour_costs, Number(data.pax_count));

        if (usdPrice === null) return;

        const newPrice = data.currency === 'PHP'
            ? computePhpPrice(usdPrice, surcharge, exchangeRate)
            : computeUsdPrice(usdPrice, surcharge);

        if (newPrice !== '') handleFinancialChange('selling_price', newPrice);
    }, [
        data.pax_count,
        data.currency,
        exchangeRate,
        selectedRoomType,
        selectedDeparture,
        selectedPackage,
    ]);

    // ── Package search / selection ─────────────────────────────────────────────

    const searchTimeout = useRef(null);

    function handlePackageSearch(term) {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            setPackageSearching(true);
            try {
                const url = term
                    ? `${tourPackageSearchUrl}?q=${encodeURIComponent(term)}`
                    : `${tourPackageSearchUrl}?q=`;
                const res  = await fetch(url);
                setPackageOptions(await res.json());
            } catch (_) {
                setPackageOptions([]);
            } finally {
                setPackageSearching(false);
            }
        }, 250);
    }

    async function handlePackageSelect(packageId) {
        if (!packageId) { clearPackage(); return; }

        try {
            const res = await fetch(`${tourPackageSearchUrl}?id=${packageId}`);
            const pkg = await res.json();
            setSelectedPackage(pkg);

            const nextDep = firstUpcomingDeparture(pkg.departure_dates);
            setSelectedDeparture(nextDep);

            const model = detectPricingModel(pkg.tour_costs);
            setSelectedRoomType(
                model === 'room_type' && pkg.tour_costs?.length
                    ? pkg.tour_costs[0].type
                    : ''
            );

            // Write locked values into form state so they submit correctly
            const computedReturn    = computeReturnDate(nextDep?.date, pkg.duration_days);
            const computedPaymentDue = computePaymentDueDate(nextDep?.date);

            setData((prev) => ({
                ...prev,
                destination      : pkg.destinations       ?? prev.destination,
                travel_date      : nextDep?.date           ?? prev.travel_date,
                return_date      : computedReturn          ?? prev.return_date,
                airline          : pkg.airline             ?? prev.airline,
                payment_due_date : computedPaymentDue      ?? prev.payment_due_date,
                ...(!isOrmocBranch ? {
                    particulars : pkg.particulars ?? '',
                    inclusions  : pkg.inclusions  ?? '',
                    exclusions  : pkg.exclusions  ?? '',
                } : {}),
            }));
        } catch (_) { /* silently ignore — staff can retry */ }
    }

    function clearPackage() {
        setSelectedPackage(null);
        setSelectedRoomType('');
        setSelectedDeparture(null);
        setData((prev) => ({
            ...prev,
            destination      : '',
            travel_date      : '',
            return_date      : '',
            airline          : '',
            payment_due_date : '',
            particulars      : '',
            inclusions       : '',
            exclusions       : '',
            selling_price    : '',
            currency         : 'PHP',
        }));
    }

    // ── Airline rate search (ticketing bookings only) ──────────────────────────

    const airlineRateSearchTimeout = useRef(null);

    function handleAirlineRateSearch(term) {
        clearTimeout(airlineRateSearchTimeout.current);
        airlineRateSearchTimeout.current = setTimeout(async () => {
            setAirlineRateSearching(true);
            try {
                const url = `${airlineRateSearchUrl}?q=${encodeURIComponent(term ?? '')}`;
                const res = await fetch(url);
                setAirlineRateOptions(await res.json());
            } catch (_) {
                setAirlineRateOptions([]);
            } finally {
                setAirlineRateSearching(false);
            }
        }, 250);
    }

    function handleAirlineRateSelect(rateId) {
        if (!rateId) return;
        const rate = airlineRateOptions.find((r) => String(r.id) === String(rateId));
        if (!rate) return;

        // Autofill airline name and net payable from the selected rate.
        // currency follows the rate's own currency so amounts stay consistent.
        setData((prev) => ({
            ...prev,
            airline     : rate.airline,
            net_payable : rate.rate,
            currency    : rate.currency,
            // Recompute income if selling_price is already set
            income      : prev.selling_price && rate.rate
                ? (parseFloat(prev.selling_price) - parseFloat(rate.rate)).toFixed(2)
                : prev.income,
        }));
    }

    // ── Financial helpers ──────────────────────────────────────────────────────

    const set     = (key) => (e) => setData(key, e.target.value);
    const options = (items) => Object.entries(items).map(([value, label]) => ({ value, label }));

    function handleFinancialChange(field, value) {
        const next = { ...data, [field]: value };
        const sp   = parseFloat(next.selling_price) || 0;
        const np   = parseFloat(next.net_payable)   || 0;
        setData({ ...next, income: sp && np ? (sp - np).toFixed(2) : next.income });
    }

    function submit(e) {
        e.preventDefault();
        isEdit ? put(route('reservation.update', booking.id)) : post(route('reservation.store'));
    }

    const cancelUrl = route('reservation.index');

    // ── Derived options ────────────────────────────────────────────────────────

    const departureDateOptions = selectedPackage?.departure_dates?.length
        ? [
            { value: '', label: 'Select departure date...' },
            ...selectedPackage.departure_dates.map((d) => ({
                value : d.date,
                label : d.surcharge > 0 ? `${d.date}  (+$${d.surcharge} peak surcharge)` : d.date,
            })),
          ]
        : [];

    const roomTypeOptions = isRoomType
        ? selectedPackage.tour_costs.map((t) => ({
            value : t.type,
            label : `${t.type} — $${Number(t.price).toLocaleString()}`,
          }))
        : [];

    // Formatted selling price for read-only display
    const sellingPriceDisplay = data.selling_price
        ? `${data.currency} ${Number(data.selling_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
        : '—';

    // Minimum pax warning — shown when package is active and pax count is below the minimum tier
    const minPax       = packageMode ? getMinPax(selectedPackage.tour_costs) : null;
    const paxTooLow    = minPax !== null && Number(data.pax_count) < minPax;

    // Submit guard — important fields must be filled before Done is enabled.
    const isFormValid = Boolean(
        data.date &&
        data.status &&
        data.client_name &&
        String(data.pax_count).trim() !== '' &&
        (isOrmocBranch || data.service_type)
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Layout helpers
    // ─────────────────────────────────────────────────────────────────────────

    // All pages share the same max-width so the stepper never changes size.
    const containerMaxWidth = '900px';

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AppShell>
            <form
                onSubmit={submit}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                style={{ gap: 'var(--space-2)' }}
            >
                {/* ── Full-width page header — no actions, they live at the bottom ── */}
                <PageHeader
                    breadcrumb={[{ label: 'Reservation & Booking', href: route('reservation.index') }]}
                    title={isEdit ? `Edit ${booking.booking_no}` : 'New Booking'}
                    inlineTitle
                />

                {/* ── Centered content — width adapts per page ──────────── */}
                <div style={{
                    maxWidth      : containerMaxWidth,
                    width         : '100%',
                    marginLeft    : 'auto',
                    marginRight   : 'auto',
                    display       : 'flex',
                    flexDirection : 'column',
                    gap           : 'var(--space-2)',
                    paddingBottom : 'var(--space-3)',
                    transition    : 'max-width 0.15s ease',
                    flex          : 1,  /* fills remaining viewport height below the page header */
                }}>

                    {/* ── Horizontal stepper ────────────────────────────── */}
                    <FormStepper
                        steps={['Booking Basics', 'Trip Details', 'Financials']}
                        current={currentPage}
                        onStep={setCurrentPage}
                    />

                    {/* ════════════════════════════════════════════════════
                        PAGE 1 — Booking Basics
                        Who is booking, service type, pax count.
                        ════════════════════════════════════════════════════ */}
                    {currentPage === 1 && (
                        <FormCard title="Booking Basics" style={{ flex: 1 }}>
                            <FormRow>
                                <Input
                                    label="Date"
                                    type="date"
                                    value={data.date}
                                    onChange={set('date')}
                                    error={errors.date}
                                    required
                                />
                                <Select
                                    label="Agent"
                                    value={data.agent_code}
                                    onChange={set('agent_code')}
                                    options={[{ value: '', label: 'Unassigned' }, ...agentCodes.map((c) => ({ value: c, label: c }))]}
                                    error={errors.agent_code}
                                />
                            </FormRow>

                            <FormRow>
                                <Select
                                    label="Status"
                                    value={data.status}
                                    onChange={set('status')}
                                    options={options(statuses)}
                                    error={errors.status}
                                    required
                                />
                                {isOrmocBranch ? (
                                    <Select
                                        label="Booking Type"
                                        value={data.booking_type}
                                        onChange={set('booking_type')}
                                        options={options(bookingTypes)}
                                        error={errors.booking_type}
                                    />
                                ) : (
                                    <Select
                                        label="Service Type"
                                        value={data.service_type}
                                        onChange={set('service_type')}
                                        options={options(serviceTypes)}
                                        error={errors.service_type}
                                        required
                                    />
                                )}
                            </FormRow>

                            {!isOrmocBranch && (
                                <FormRow>
                                    <Select
                                        label="Transaction Type"
                                        value={data.transaction_type}
                                        onChange={set('transaction_type')}
                                        options={[{ value: '', label: 'Not set' }, ...options(transactionTypes)]}
                                        error={errors.transaction_type}
                                    />
                                    <Input
                                        label="Source"
                                        value={data.source}
                                        onChange={set('source')}
                                        error={errors.source}
                                        placeholder="Walk-in, Referral, Online"
                                    />
                                </FormRow>
                            )}

                            <Input
                                label="Client Name"
                                value={data.client_name}
                                onChange={set('client_name')}
                                error={errors.client_name}
                                required
                            />

                            <Input
                                label="Contact Person"
                                value={data.contact_person}
                                onChange={set('contact_person')}
                                error={errors.contact_person}
                                placeholder="Corporate coordinator — leave blank for FIT"
                            />

                            <FormRow>
                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={set('date_of_birth')}
                                    error={errors.date_of_birth}
                                />
                                <Input
                                    label="Contact Number"
                                    value={data.contact_number}
                                    onChange={set('contact_number')}
                                    error={errors.contact_number}
                                />
                            </FormRow>

                            <FormRow>
                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={set('email')}
                                    error={errors.email}
                                />
                                {isOrmocBranch ? (
                                    <Input
                                        label="Passport Expiry"
                                        type="date"
                                        value={data.passport_expiry}
                                        onChange={set('passport_expiry')}
                                        error={errors.passport_expiry}
                                    />
                                ) : (
                                    <Input
                                        label="Corporate Account"
                                        value={data.corporate_account}
                                        onChange={set('corporate_account')}
                                        error={errors.corporate_account}
                                    />
                                )}
                            </FormRow>

                            {/* Pax count — moved here from Trip Details;
                                drives package price tier matching on page 2. */}
                            <div>
                                <Input
                                    label="Pax Count"
                                    type="number"
                                    min="1"
                                    value={data.pax_count}
                                    onChange={set('pax_count')}
                                    error={errors.pax_count}
                                    required
                                />
                                {paxTooLow && (
                                    <p style={{
                                        fontSize  : 'var(--font-size-small)',
                                        fontFamily: 'var(--font-body)',
                                        color     : 'var(--color-warning)',
                                        marginTop : 4,
                                        fontWeight: 600,
                                    }}>
                                        ⚠ This package requires a minimum of {minPax} passengers.
                                    </p>
                                )}
                            </div>
                        </FormCard>
                    )}

                    {/* ════════════════════════════════════════════════════
                        PAGE 2 — Trip Details
                        QC: two-column layout (selection left, text fields right).
                        Ormoc: single column.
                        ════════════════════════════════════════════════════ */}
                    {currentPage === 2 && (
                        <FormCard title="Trip Details" style={{ flex: 1 }}>
                            {!isOrmocBranch ? (
                                /* ── QC: two-column layout ──────────────────────── */
                                <div style={{
                                    display              : 'grid',
                                    gridTemplateColumns  : '1fr 1fr',
                                    gap                  : 'var(--space-3)',
                                    alignItems           : 'start',
                                }}>
                                    {/* Left column — package config, airline, destination, dates */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>

                                        {/* ── Package selector ───────────────────────── */}
                                        {showPkgSelector && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span className="font-body font-semibold text-[var(--color-text)]"
                                                            style={{ fontSize: 'var(--font-size-small)' }}>
                                                            {packageMode ? selectedPackage.package_name : 'Tour Package'}
                                                        </span>
                                                        {packageMode && (
                                                            <button
                                                                type="button"
                                                                onClick={clearPackage}
                                                                style={{
                                                                    fontSize  : 'var(--font-size-small)',
                                                                    fontFamily: 'var(--font-body)',
                                                                    fontWeight: 600,
                                                                    color     : 'var(--color-error)',
                                                                    background: 'transparent',
                                                                    border    : 'none',
                                                                    cursor    : 'pointer',
                                                                    padding   : 0,
                                                                }}
                                                            >
                                                                Change package
                                                            </button>
                                                        )}
                                                    </div>

                                                    {!packageMode && (
                                                        <Select
                                                            value=""
                                                            onChange={(e) => handlePackageSelect(e.target.value)}
                                                            options={[
                                                                { value: '', label: packageSearching ? 'Loading...' : 'Select a package...' },
                                                                ...packageOptions.map((p) => ({
                                                                    value: p.id,
                                                                    label: `${p.country} — ${p.package_name}${p.lowest_price ? ` (from $${p.lowest_price})` : ''}`,
                                                                })),
                                                            ]}
                                                            onFocus={() => handlePackageSearch('')}
                                                        />
                                                    )}
                                                </div>

                                                {packageMode && (
                                                    <>
                                                        {departureDateOptions.length > 1 && (
                                                            <Select
                                                                label="Departure Date"
                                                                value={selectedDeparture?.date ?? ''}
                                                                onChange={(e) => {
                                                                    const found = selectedPackage.departure_dates?.find(
                                                                        (d) => d.date === e.target.value
                                                                    );
                                                                    setSelectedDeparture(found ?? null);
                                                                    if (found) {
                                                                        const ret = computeReturnDate(found.date, selectedPackage.duration_days);
                                                                        const due = computePaymentDueDate(found.date);
                                                                        setData((prev) => ({
                                                                            ...prev,
                                                                            travel_date      : found.date,
                                                                            return_date      : ret ?? prev.return_date,
                                                                            payment_due_date : due ?? prev.payment_due_date,
                                                                        }));
                                                                    }
                                                                }}
                                                                options={departureDateOptions}
                                                            />
                                                        )}

                                                        {isRoomType && (
                                                            <Select
                                                                label="Room Type"
                                                                value={selectedRoomType}
                                                                onChange={(e) => setSelectedRoomType(e.target.value)}
                                                                options={roomTypeOptions}
                                                            />
                                                        )}

                                                        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                                                            <span className="font-body font-semibold text-[var(--color-text)]"
                                                                style={{ fontSize: 'var(--font-size-small)', flexShrink: 0 }}>
                                                                Currency
                                                            </span>
                                                            {['PHP', 'USD'].map((cur) => (
                                                                <button
                                                                    key={cur}
                                                                    type="button"
                                                                    onClick={() => setData('currency', cur)}
                                                                    style={{
                                                                        padding     : '4px 14px',
                                                                        borderRadius: 'var(--radius-md)',
                                                                        border      : '1.5px solid',
                                                                        borderColor : data.currency === cur ? 'var(--color-primary)' : 'var(--color-border)',
                                                                        background  : data.currency === cur ? 'var(--color-primary)' : 'transparent',
                                                                        color       : data.currency === cur ? '#fff' : 'var(--color-text)',
                                                                        fontSize    : 'var(--font-size-small)',
                                                                        fontFamily  : 'var(--font-body)',
                                                                        fontWeight  : 600,
                                                                        cursor      : 'pointer',
                                                                    }}
                                                                >
                                                                    {cur}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {showExchangeRate && (
                                                            <div>
                                                                <Input
                                                                    label="Exchange Rate (USD → PHP)"
                                                                    type="number"
                                                                    step="0.0001"
                                                                    value={exchangeRate}
                                                                    onChange={(e) => setExchangeRate(e.target.value)}
                                                                    placeholder={liveRate ? String(liveRate) : 'Enter rate manually'}
                                                                />
                                                                {rateError && (
                                                                    <p style={{
                                                                        fontSize  : 'var(--font-size-small)',
                                                                        fontFamily: 'var(--font-body)',
                                                                        color     : 'var(--color-warning)',
                                                                        marginTop : 4,
                                                                    }}>
                                                                        ⚠ {rateError}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Airline */}
                                        {packageMode ? (
                                            <PackageReadOnlyField
                                                label="Airline"
                                                value={data.airline}
                                            />
                                        ) : showTicketing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span style={{
                                                    fontSize  : 'var(--font-size-small)',
                                                    fontFamily: 'var(--font-body)',
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    color     : 'var(--color-text)',
                                                }}>
                                                    Airline Rate
                                                </span>
                                                <Select
                                                    value=""
                                                    onChange={(e) => handleAirlineRateSelect(e.target.value)}
                                                    options={[
                                                        { value: '', label: airlineRateSearching ? 'Searching...' : data.airline ? `Selected: ${data.airline}` : 'Select a rate...' },
                                                        ...airlineRateOptions.map((r) => ({
                                                            value: r.id,
                                                            label: `${r.airline} ${r.origin}→${r.destination}${r.fare_class ? ` (${r.fare_class})` : ''} — ${r.currency} ${Number(r.rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
                                                        })),
                                                    ]}
                                                    onFocus={() => handleAirlineRateSearch('')}
                                                />
                                                {data.airline && (
                                                    <span style={{
                                                        fontSize  : 'var(--font-size-small)',
                                                        fontFamily: 'var(--font-body)',
                                                        color     : 'var(--color-text-muted)',
                                                    }}>
                                                        {data.airline}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Input
                                                label="Airline"
                                                value={data.airline}
                                                onChange={set('airline')}
                                                error={errors.airline}
                                                placeholder="e.g. Cebu Pacific, PAL"
                                            />
                                        )}

                                        {/* Destination */}
                                        {packageMode ? (
                                            <PackageReadOnlyField
                                                label="Destination"
                                                value={data.destination}
                                            />
                                        ) : (
                                            <Input
                                                label="Destination"
                                                value={data.destination}
                                                onChange={set('destination')}
                                                error={errors.destination}
                                            />
                                        )}

                                        {/* Travel Date */}
                                        {packageMode ? (
                                            <PackageReadOnlyField
                                                label="Travel Date"
                                                value={data.travel_date}
                                            />
                                        ) : (
                                            <Input
                                                label="Travel Date"
                                                type="date"
                                                value={data.travel_date}
                                                onChange={set('travel_date')}
                                                error={errors.travel_date}
                                            />
                                        )}

                                        {/* Return Date (QC only) */}
                                        {packageMode ? (
                                            <PackageReadOnlyField
                                                label="Return Date"
                                                value={data.return_date}
                                            />
                                        ) : (
                                            <Input
                                                label="Return Date"
                                                type="date"
                                                value={data.return_date}
                                                onChange={set('return_date')}
                                                error={errors.return_date}
                                            />
                                        )}
                                    </div>

                                    {/* Right column — text-heavy fields that drive vertical height */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                        {packageMode ? (
                                            <>
                                                <PackageReadOnlyField
                                                    label="Particulars"
                                                    value={data.particulars}
                                                />
                                                <PackageReadOnlyField
                                                    label="Inclusions"
                                                    value={data.inclusions}
                                                    multiline
                                                />
                                                <PackageReadOnlyField
                                                    label="Exclusions"
                                                    value={data.exclusions}
                                                    multiline
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Textarea
                                                    label="Particulars"
                                                    value={data.particulars}
                                                    onChange={set('particulars')}
                                                    rows={3}
                                                    error={errors.particulars}
                                                />
                                                <Textarea
                                                    label="Inclusions"
                                                    value={data.inclusions}
                                                    onChange={set('inclusions')}
                                                    rows={5}
                                                    error={errors.inclusions}
                                                />
                                                <Textarea
                                                    label="Exclusions"
                                                    value={data.exclusions}
                                                    onChange={set('exclusions')}
                                                    rows={5}
                                                    error={errors.exclusions}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* ── Ormoc: single-column layout ────────────────── */
                                <>
                                    {showPkgSelector && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span className="font-body font-semibold text-[var(--color-text)]"
                                                        style={{ fontSize: 'var(--font-size-small)' }}>
                                                        {packageMode ? selectedPackage.package_name : 'Tour Package'}
                                                    </span>
                                                    {packageMode && (
                                                        <button
                                                            type="button"
                                                            onClick={clearPackage}
                                                            style={{
                                                                fontSize  : 'var(--font-size-small)',
                                                                fontFamily: 'var(--font-body)',
                                                                fontWeight: 600,
                                                                color     : 'var(--color-error)',
                                                                background: 'transparent',
                                                                border    : 'none',
                                                                cursor    : 'pointer',
                                                                padding   : 0,
                                                            }}
                                                        >
                                                            Change package
                                                        </button>
                                                    )}
                                                </div>

                                                {!packageMode && (
                                                    <Select
                                                        value=""
                                                        onChange={(e) => handlePackageSelect(e.target.value)}
                                                        options={[
                                                            { value: '', label: packageSearching ? 'Loading...' : 'Select a package...' },
                                                            ...packageOptions.map((p) => ({
                                                                value: p.id,
                                                                label: `${p.country} — ${p.package_name}${p.lowest_price ? ` (from $${p.lowest_price})` : ''}`,
                                                            })),
                                                        ]}
                                                        onFocus={() => handlePackageSearch('')}
                                                    />
                                                )}
                                            </div>

                                            {packageMode && (
                                                <>
                                                    {departureDateOptions.length > 1 && (
                                                        <Select
                                                            label="Departure Date"
                                                            value={selectedDeparture?.date ?? ''}
                                                            onChange={(e) => {
                                                                const found = selectedPackage.departure_dates?.find(
                                                                    (d) => d.date === e.target.value
                                                                );
                                                                setSelectedDeparture(found ?? null);
                                                                if (found) {
                                                                    const ret = computeReturnDate(found.date, selectedPackage.duration_days);
                                                                    const due = computePaymentDueDate(found.date);
                                                                    setData((prev) => ({
                                                                        ...prev,
                                                                        travel_date      : found.date,
                                                                        return_date      : ret ?? prev.return_date,
                                                                        payment_due_date : due ?? prev.payment_due_date,
                                                                    }));
                                                                }
                                                            }}
                                                            options={departureDateOptions}
                                                        />
                                                    )}

                                                    {isRoomType && (
                                                        <Select
                                                            label="Room Type"
                                                            value={selectedRoomType}
                                                            onChange={(e) => setSelectedRoomType(e.target.value)}
                                                            options={roomTypeOptions}
                                                        />
                                                    )}

                                                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                                                        <span className="font-body font-semibold text-[var(--color-text)]"
                                                            style={{ fontSize: 'var(--font-size-small)', flexShrink: 0 }}>
                                                            Currency
                                                        </span>
                                                        {['PHP', 'USD'].map((cur) => (
                                                            <button
                                                                key={cur}
                                                                type="button"
                                                                onClick={() => setData('currency', cur)}
                                                                style={{
                                                                    padding     : '4px 14px',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    border      : '1.5px solid',
                                                                    borderColor : data.currency === cur ? 'var(--color-primary)' : 'var(--color-border)',
                                                                    background  : data.currency === cur ? 'var(--color-primary)' : 'transparent',
                                                                    color       : data.currency === cur ? '#fff' : 'var(--color-text)',
                                                                    fontSize    : 'var(--font-size-small)',
                                                                    fontFamily  : 'var(--font-body)',
                                                                    fontWeight  : 600,
                                                                    cursor      : 'pointer',
                                                                }}
                                                            >
                                                                {cur}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {showExchangeRate && (
                                                        <div>
                                                            <Input
                                                                label="Exchange Rate (USD → PHP)"
                                                                type="number"
                                                                step="0.0001"
                                                                value={exchangeRate}
                                                                onChange={(e) => setExchangeRate(e.target.value)}
                                                                placeholder={liveRate ? String(liveRate) : 'Enter rate manually'}
                                                            />
                                                            {rateError && (
                                                                <p style={{
                                                                    fontSize  : 'var(--font-size-small)',
                                                                    fontFamily: 'var(--font-body)',
                                                                    color     : 'var(--color-warning)',
                                                                    marginTop : 4,
                                                                }}>
                                                                    ⚠ {rateError}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Airline */}
                                    {packageMode ? (
                                        <PackageReadOnlyField label="Airline" value={data.airline} />
                                    ) : (
                                        <Input
                                            label="Airline"
                                            value={data.airline}
                                            onChange={set('airline')}
                                            error={errors.airline}
                                            placeholder="e.g. Cebu Pacific, PAL"
                                        />
                                    )}

                                    {/* Destination */}
                                    {packageMode ? (
                                        <PackageReadOnlyField label="Destination" value={data.destination} />
                                    ) : (
                                        <Input
                                            label="Destination"
                                            value={data.destination}
                                            onChange={set('destination')}
                                            error={errors.destination}
                                        />
                                    )}

                                    {/* Travel Date */}
                                    {packageMode ? (
                                        <PackageReadOnlyField label="Travel Date" value={data.travel_date} />
                                    ) : (
                                        <Input
                                            label="Travel Date"
                                            type="date"
                                            value={data.travel_date}
                                            onChange={set('travel_date')}
                                            error={errors.travel_date}
                                        />
                                    )}

                                    {/* Ormoc-specific: hotel, room type, flight details, notes */}
                                    <FormRow>
                                        <Input
                                            label="Hotel"
                                            value={data.hotel}
                                            onChange={set('hotel')}
                                            error={errors.hotel}
                                        />
                                        <Input
                                            label="Room Type"
                                            value={data.room_type}
                                            onChange={set('room_type')}
                                            error={errors.room_type}
                                        />
                                    </FormRow>
                                    <Textarea
                                        label="Flight Details"
                                        value={data.flight_details}
                                        onChange={set('flight_details')}
                                        rows={2}
                                        error={errors.flight_details}
                                    />
                                    <Textarea
                                        label="Notes"
                                        value={data.notes}
                                        onChange={set('notes')}
                                        rows={3}
                                        error={errors.notes}
                                    />
                                </>
                            )}
                        </FormCard>
                    )}

                    {/* ════════════════════════════════════════════════════
                        PAGE 3 — Financials, Payment & References
                        Two-column layout — same approach as Trip Details.
                        Left: price amounts. Right: payment + reference numbers.
                        ════════════════════════════════════════════════════ */}
                    {currentPage === 3 && (
                        <FormCard title="Financials, Payment & References" style={{ flex: 1 }}>
                            <div style={{
                                display             : 'grid',
                                gridTemplateColumns : '1fr 1fr',
                                gap                 : 'var(--space-3)',
                                alignItems          : 'start',
                            }}>

                                {/* ── Left column — price & financial amounts ──── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>

                                    {/* Selling price — locked read-only when package active,
                                        computed from tier + surcharge + exchange rate.
                                        Fully editable for FIT / custom bookings.          */}
                                    {packageMode ? (
                                        <PackageReadOnlyField
                                            label={`Selling Price (${data.currency}) — computed`}
                                            value={sellingPriceDisplay}
                                        />
                                    ) : (
                                        <Input
                                            label={`Selling Price${data.currency ? ` (${data.currency})` : ''}`}
                                            type="number"
                                            step="0.01"
                                            value={data.selling_price}
                                            onChange={(e) => handleFinancialChange('selling_price', e.target.value)}
                                            error={errors.selling_price}
                                        />
                                    )}

                                    <Input
                                        label="Net Payable"
                                        type="number"
                                        step="0.01"
                                        value={data.net_payable}
                                        onChange={(e) => handleFinancialChange('net_payable', e.target.value)}
                                        error={errors.net_payable}
                                    />

                                    <FormRow>
                                        <Input
                                            label="Income (auto-computed)"
                                            type="number"
                                            step="0.01"
                                            value={data.income}
                                            onChange={(e) => setData('income', e.target.value)}
                                            error={errors.income}
                                            disabled
                                            readOnly
                                        />
                                        {!isOrmocBranch && (
                                            <Input
                                                label="Excess"
                                                type="number"
                                                step="0.01"
                                                value={data.excess}
                                                onChange={(e) => setData('excess', e.target.value)}
                                                error={errors.excess}
                                            />
                                        )}
                                    </FormRow>

                                    {!isOrmocBranch && (
                                        <FormRow>
                                            <Input
                                                label="Insurance (Nett)"
                                                type="number"
                                                step="0.01"
                                                value={data.insurance_nett}
                                                onChange={(e) => setData('insurance_nett', e.target.value)}
                                                error={errors.insurance_nett}
                                            />
                                            <Input
                                                label="ACR"
                                                value={data.acr}
                                                onChange={set('acr')}
                                                error={errors.acr}
                                                placeholder="ACR reference"
                                            />
                                        </FormRow>
                                    )}
                                </div>

                                {/* ── Right column — payment & reference numbers ─ */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>

                                    <FormRow>
                                        <Select
                                            label="Payment Mode"
                                            value={data.mode_of_payment}
                                            onChange={set('mode_of_payment')}
                                            options={[{ value: '', label: 'Not set' }, ...options(paymentModes)]}
                                            error={errors.mode_of_payment}
                                        />
                                        {isOrmocBranch ? (
                                            <Input
                                                label="Date of Payment"
                                                type="date"
                                                value={data.date_of_payment}
                                                onChange={set('date_of_payment')}
                                                error={errors.date_of_payment}
                                            />
                                        ) : packageMode ? (
                                            <PackageReadOnlyField
                                                label="Payment Due"
                                                value={data.payment_due_date}
                                            />
                                        ) : (
                                            <Input
                                                label="Payment Due"
                                                type="date"
                                                value={data.payment_due_date}
                                                onChange={set('payment_due_date')}
                                                error={errors.payment_due_date}
                                            />
                                        )}
                                    </FormRow>

                                    <FormRow>
                                        <Input
                                            label="SOA Number"
                                            value={data.soa_number}
                                            onChange={set('soa_number')}
                                            error={errors.soa_number}
                                        />
                                        <Input
                                            label="PO Number"
                                            value={data.po_number}
                                            onChange={set('po_number')}
                                            error={errors.po_number}
                                        />
                                    </FormRow>

                                    <FormRow>
                                        <Input
                                            label="SI Number"
                                            value={data.si_number}
                                            onChange={set('si_number')}
                                            error={errors.si_number}
                                        />
                                        <Input
                                            label="AR Number"
                                            value={data.ar_number}
                                            onChange={set('ar_number')}
                                            error={errors.ar_number}
                                        />
                                    </FormRow>

                                    <Input
                                        label="OR Number"
                                        value={data.or_number}
                                        onChange={set('or_number')}
                                        error={errors.or_number}
                                    />

                                    <Textarea
                                        label="Remarks"
                                        value={data.remarks}
                                        onChange={set('remarks')}
                                        rows={2}
                                        error={errors.remarks}
                                    />

                                    <Textarea
                                        label="Audit Remarks"
                                        value={data.audit_remarks}
                                        onChange={set('audit_remarks')}
                                        rows={2}
                                        error={errors.audit_remarks}
                                    />
                                </div>
                            </div>
                        </FormCard>
                    )}

                    {/* ── Action bar ────────────────────────────────────────
                        Back (pages 2 & 3) sits bottom-left, well away from
                        Cancel + Next/Done which stay bottom-right.            */}
                    <div style={{
                        display        : 'flex',
                        justifyContent : 'space-between',
                        alignItems     : 'center',
                        paddingBottom  : 'var(--space-3)',
                    }}>
                        {/* Back — only visible on pages 2 and 3 */}
                        <div>
                            {currentPage > 1 && (
                                <Button
                                    type="button"
                                    variant="cancel"
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    Back
                                </Button>
                            )}
                        </div>

                        {/* Cancel + Next / Done */}
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <FormCancelButton onClick={() => router.get(cancelUrl)} />
                            {currentPage < 3 ? (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            ) : (
                                <FormSubmitButton
                                    loading={processing}
                                    disabled={!isFormValid || processing}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </AppShell>
    );
}
