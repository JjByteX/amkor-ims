/**
 * fieldConstraints — central field limit + placeholder rules.
 *
 * Returns { maxLength, inputMode, placeholder } based on the field label and type.
 * Applied automatically by Input.jsx and Textarea.jsx — no per-page changes needed.
 *
 * Placeholder policy: only added where the label alone doesn't convey the
 * expected FORMAT (phone layout, ID/TIN layout, decimal amounts, email shape).
 * Self-explanatory fields (First Name, Position, Status dropdowns, etc.) are
 * deliberately left without a placeholder — see fieldConstraints below.
 * Pages may always override by passing `placeholder` directly as a prop;
 * an explicit prop wins over this file every time.
 *
 * Limits are realistic for a Philippine travel agency IMS:
 *   - Amounts          → 12 chars  (covers ₱9,999,999.99)
 *   - Pax / qty count  → 3 chars   (up to 999; tours rarely exceed 100)
 *   - SIL days         → 2 chars   (max 30 days leave)
 *   - Phone / TIN etc  → see table below
 *   - Names            → 100 chars
 *   - Reference nos    → 50 chars
 *   - Remarks / notes  → 500 chars
 *   - Marketing copy   → 2200 chars (Instagram caption limit)
 *
 * Callers may always override by passing maxLength/inputMode directly as props.
 */
export function fieldConstraints(label = '', type = 'text') {
    // Textarea: long-form by default, keyword overrides still apply below
    if (type === 'textarea') {
        const l = label.toLowerCase();
        // Marketing captions / post copy can be up to Instagram's 2200 limit
        if (/caption|post.?copy/.test(l)) return { maxLength: 2200 };
        // Descriptions / briefs / particulars — generous but bounded
        if (/description|brief|particulars|details|inclusions|exclusions|flight/.test(l)) return { maxLength: 1000 };
        // Everything else (remarks, notes, address, home address)
        return { maxLength: 500 };
    }

    const l = label.toLowerCase();

    // ── numeric types ──────────────────────────────────────────────────────
    if (type === 'number') {
        // SIL days — max 30 realistically
        if (/sil/.test(l)) return { inputMode: 'numeric', maxLength: 2 };
        // Pax count, qty — up to 999
        if (/pax|qty|quantity|count/.test(l)) return { inputMode: 'numeric', maxLength: 3 };
        // Currency / decimal amounts — covers ₱9,999,999.99
        return { inputMode: 'decimal', maxLength: 12, placeholder: '0.00' };
    }

    // ── email ──────────────────────────────────────────────────────────────
    if (type === 'email') return { maxLength: 100, placeholder: 'name@email.com' };

    // ── by label keyword ───────────────────────────────────────────────────

    // Agent code — "e.g. RT", short codes
    if (/^agent code/.test(l)) return { maxLength: 10, placeholder: 'e.g. RT01' };

    // Suffix — "Jr., Sr., III"
    if (/^suffix/.test(l)) return { maxLength: 10 };

    // Phone / contact / viber — "+63 917 000 0000" = 16 chars, give a bit of room
    if (/contact.?number|phone|viber|mobile/.test(l)) {
        return { inputMode: 'tel', maxLength: 20, placeholder: '+63 9XX XXX XXXX' };
    }

    // TIN — "000-000-000-00000" = 17 chars
    if (/\btin\b/.test(l)) return { maxLength: 20, placeholder: '000-000-000-00000' };

    // Government ID numbers — SSS (12), PhilHealth (12), Pag-IBIG (12), PhilCare
    if (/sss|philhealth|pag.?ibig|philcare/.test(l)) return { maxLength: 15 };

    // Bank / account numbers — IBAN up to 34, local accounts ~16
    if (/account.?(no|num|number|#)|bank account/.test(l)) return { maxLength: 30 };

    // Reference / document numbers — OR, SI, AR, PO, CV, SOA, check, requisition
    if (/\b(or|si|ar|po|cv|soa|acr)\b|check.?(no|num|number|#)|requisition|billing.?ref|voucher.?(no|num)|reference/.test(l)) {
        return { maxLength: 50 };
    }

    // Short label that ends in "#" or "number" — catch-all for doc numbers
    if (/#$|number$/.test(l.trim())) return { maxLength: 50 };

    // Names, payee, position, agency, bank name, provider, courier, operator
    if (/name|payee|position|agency|operator|provider|courier|relationship/.test(l)) {
        // Only the ambiguous "whose full name is this" fields get a hint —
        // First Name / Last Name / Nickname / Bank Name etc. are self-explanatory.
        if (/^(client|customer|guest|applicant|supplier) name$/.test(l.trim())) {
            return { maxLength: 100, placeholder: 'Full name' };
        }
        if (/^payee$/.test(l.trim())) {
            return { maxLength: 100, placeholder: 'Payee name' };
        }
        return { maxLength: 100 };
    }

    // Short descriptors
    if (/destination|source|room.?type|terms|size$|item$|business.?style|title/.test(l)) {
        return { maxLength: 100 };
    }

    // Address fields in a plain Input (not Textarea) — still keep reasonable
    if (/address|remark|note|description|particulars|details|caption|brief|flight/.test(l)) {
        return { maxLength: 500 };
    }

    // Generic fallback
    return { maxLength: 100 };
}
