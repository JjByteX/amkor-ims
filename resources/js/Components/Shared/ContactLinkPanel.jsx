import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Link2, Search, X, Building2 } from 'lucide-react';
import { PanelField, PanelFieldRow } from './DetailPanel';
import Button from '../UI/Button';

/**
 * ContactLinkPanel — "Link Contact" widget for booking/visa Show pages.
 *
 * Lets Accounting search the Contacts module and link a contact to this
 * record. Once linked, TIN/address/business_style flow into the BIR
 * transaction automatically (see BirCompliance listeners).
 *
 * Props:
 *   contact            : the currently-linked Contact object, or null/undefined
 *   contactsSearchUrl  : route('contacts.search') — typeahead endpoint
 *   linkUrl            : route(<module>.link-contact, id)   — POST { contact_id }
 *   unlinkUrl          : route(<module>.unlink-contact, id) — DELETE
 *   canLink            : bool — whether the current user may link/unlink (default true)
 */
export default function ContactLinkPanel({ contact, contactsSearchUrl, linkUrl, unlinkUrl, canLink = true }) {
    const [query, setQuery]   = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen]     = useState(false);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy]     = useState(false);
    const boxRef = useRef(null);

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
        setBusy(true);
        router.post(linkUrl, { contact_id: c.id }, {
            preserveScroll: true,
            onFinish: () => { setBusy(false); setOpen(false); setQuery(''); setResults([]); },
        });
    }

    function unlink() {
        setBusy(true);
        router.delete(unlinkUrl, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    }

    if (contact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <PanelFieldRow>
                    <PanelField label="Linked Contact" value={contact.name} highlight />
                    <PanelField label="TIN" value={contact.tin || '—'} mono />
                </PanelFieldRow>
                {contact.address && <PanelField label="Address" value={contact.address} />}
                {canLink && (
                    <Button variant="ghost" size="sm" icon={X} loading={busy} onClick={unlink} style={{ width: '100%' }}>
                        Unlink Contact
                    </Button>
                )}
            </div>
        );
    }

    if (!canLink) {
        return <PanelField label="Linked Contact" value="None" />;
    }

    return (
        <div ref={boxRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{
                fontSize: 'var(--font-size-small)',
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
            }}>
                Linked Contact
            </label>
            <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search contacts by name or TIN..."
                    disabled={busy}
                    style={{
                        width: '100%',
                        height: 40,
                        boxSizing: 'border-box',
                        padding: '0 12px 0 32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--font-size-body)',
                        fontFamily: 'var(--font-body)',
                        background: 'var(--color-card)',
                        color: 'var(--color-text)',
                    }}
                />
            </div>
            {open && query.trim() && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    zIndex: 20,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-card)',
                    maxHeight: 240,
                    overflowY: 'auto',
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
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-body)',
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-small)', color: 'var(--color-text-muted)' }}>
                <Link2 size={12} /> Link a contact to auto-fill TIN on the BIR record.
            </span>
        </div>
    );
}
