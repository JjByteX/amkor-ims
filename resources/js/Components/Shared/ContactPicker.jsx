import { useEffect, useRef, useState } from 'react';
import { Search, X, Building2, Link2 } from 'lucide-react';

/**
 * ContactPicker — typeahead contact search for Create/Edit forms.
 *
 * Unlike ContactLinkPanel (which posts immediately from a Show page),
 * this component is fully controlled: it just reports the selected
 * contact's id (and the contact object, for auto-fill) back to the
 * parent form via onChange. Nothing is saved until the form itself
 * is submitted.
 *
 * Props:
 *   label             : field label (default "Linked Contact")
 *   value             : currently selected contact_id (string|number|'')
 *   initialContact    : the currently-linked Contact object on Edit forms
 *                        ({ id, name, tin, address }) — used to render the
 *                        selected chip before any search happens
 *   contactsSearchUrl : route('contacts.search') — typeahead endpoint
 *   onChange          : (contactId: string, contact: object|null) => void
 *   error             : validation error string
 *   hint              : optional helper text shown under the field
 */
export default function ContactPicker({
    label = 'Linked Contact',
    value,
    initialContact = null,
    contactsSearchUrl,
    onChange,
    error = null,
    hint = 'Link a contact to auto-fill TIN on the BIR record.',
}) {
    const [query, setQuery]     = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen]       = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(initialContact);
    const boxRef = useRef(null);

    // Keep the displayed chip in sync if the parent resets initialContact
    // (e.g. after an Inertia reload on Edit pages).
    useEffect(() => {
        setSelected(initialContact ?? null);
    }, [initialContact?.id]);

    useEffect(() => {
        function onClickOutside(e) {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        if (!contactsSearchUrl) return;

        setLoading(true);
        const handle = setTimeout(() => {
            fetch(`${contactsSearchUrl}?q=${encodeURIComponent(query)}&limit=10`, {
                headers: { Accept: 'application/json' },
            })
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => setResults(Array.isArray(data) ? data : []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 250);

        return () => clearTimeout(handle);
    }, [query, contactsSearchUrl]);

    function selectContact(c) {
        setSelected(c);
        setOpen(false);
        setQuery('');
        setResults([]);
        onChange?.(String(c.id), c);
    }

    function clearSelection() {
        setSelected(null);
        onChange?.('', null);
    }

    const labelEl = (
        <label style={{
            fontSize  : 'var(--font-size-small)',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--font-weight-semibold)',
            color     : 'var(--color-text)',
            lineHeight: 1.25,
        }}>
            {label}
        </label>
    );

    // ── Selected state — show a chip with TIN/address and a clear button ─────
    if (selected && (value || value === 0 || String(value) === String(selected.id))) {
        return (
            <div className="flex flex-col gap-1">
                {labelEl}
                <div style={{
                    display      : 'flex',
                    alignItems   : 'center',
                    justifyContent: 'space-between',
                    gap          : 8,
                    minHeight    : 'var(--height-input)',
                    boxSizing    : 'border-box',
                    padding      : '8px 12px',
                    borderRadius : 'var(--radius-md)',
                    border       : 'var(--border-container)',
                    background   : 'var(--color-card)',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--color-text)' }}>
                            <Building2 size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
                        </span>
                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                            {selected.tin ? `TIN: ${selected.tin}` : 'No TIN on file'}
                            {selected.address ? ` · ${selected.address}` : ''}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        aria-label="Remove linked contact"
                        style={{
                            display       : 'flex',
                            alignItems    : 'center',
                            justifyContent: 'center',
                            width         : 28,
                            height        : 28,
                            flexShrink    : 0,
                            border        : 'none',
                            background    : 'transparent',
                            color         : 'var(--color-text-muted)',
                            cursor        : 'pointer',
                            borderRadius  : 'var(--radius-md)',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
                {error && (
                    <p style={{ fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-error)', marginTop: 2 }}>
                        {error}
                    </p>
                )}
            </div>
        );
    }

    // ── Empty state — search box with typeahead dropdown ─────────────────────
    return (
        <div ref={boxRef} className="flex flex-col gap-1" style={{ position: 'relative' }}>
            {labelEl}
            <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search contacts by name or TIN..."
                    style={{
                        width       : '100%',
                        height      : 'var(--height-input)',
                        boxSizing   : 'border-box',
                        padding     : '0 12px 0 32px',
                        borderRadius: 'var(--radius-md)',
                        border      : error ? '1.5px solid var(--color-error)' : 'var(--border-container)',
                        fontSize    : 'var(--font-size-body)',
                        fontFamily  : 'var(--font-body)',
                        fontWeight  : 500,
                        background  : 'var(--color-card)',
                        color       : 'var(--color-text)',
                    }}
                />
            </div>
            {open && query.trim() && (
                <div style={{
                    position    : 'absolute',
                    top         : '100%',
                    left        : 0,
                    right       : 0,
                    marginTop   : 4,
                    zIndex      : 20,
                    background  : 'var(--color-card)',
                    border      : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow   : 'var(--shadow-card)',
                    maxHeight   : 240,
                    overflowY   : 'auto',
                }}>
                    {loading && (
                        <div style={{ padding: '10px 12px', fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                            Searching...
                        </div>
                    )}
                    {!loading && results.length === 0 && (
                        <div style={{ padding: '10px 12px', fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                            No contacts found.
                        </div>
                    )}
                    {!loading && results.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => selectContact(c)}
                            style={{
                                display      : 'flex',
                                flexDirection: 'column',
                                gap          : 2,
                                width        : '100%',
                                textAlign    : 'left',
                                padding      : '8px 12px',
                                border       : 'none',
                                background   : 'transparent',
                                cursor       : 'pointer',
                                fontFamily   : 'var(--font-body)',
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text)' }}>
                                <Building2 size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                                {c.name}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                                {c.tin ? `TIN: ${c.tin}` : 'No TIN on file'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            {error ? (
                <p style={{ fontSize: 'var(--font-size-small)', fontFamily: 'var(--font-body)', color: 'var(--color-error)', marginTop: 2 }}>
                    {error}
                </p>
            ) : hint ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                    <Link2 size={12} /> {hint}
                </span>
            ) : null}
        </div>
    );
}
