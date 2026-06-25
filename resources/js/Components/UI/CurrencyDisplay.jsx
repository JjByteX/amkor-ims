/**
 * CurrencyDisplay — formats a monetary value with the correct currency symbol.
 *
 * Renders as a right-aligned block so money columns in tables align correctly
 * without needing per-column alignment overrides on every page.
 *
 * Props:
 *   amount   : number | string | null
 *   currency : 'PHP' | 'USD' | 'JPY'   (default: 'PHP')
 *   decimals : number                   (default: 2; JPY defaults to 0)
 *   className: string
 *   showCode : bool                     (show currency code after amount, default: false)
 */
export default function CurrencyDisplay({
    amount,
    currency  = 'PHP',
    decimals,
    className = '',
    showCode  = false,
}) {
    if (amount === null || amount === undefined || amount === '') {
        return <span className={`font-body text-gray-400 block text-right ${className}`}>—</span>;
    }

    const num = parseFloat(amount);
    if (isNaN(num)) {
        return <span className={`font-body text-gray-400 block text-right ${className}`}>—</span>;
    }

    // Default decimal places per currency
    const dp = decimals !== undefined
        ? decimals
        : currency === 'JPY' ? 0 : 2;

    const symbols = { PHP: '₱', USD: '$', JPY: '¥' };
    const symbol  = symbols[currency] ?? currency;

    const formatted = new Intl.NumberFormat('en-PH', {
        minimumFractionDigits : dp,
        maximumFractionDigits : dp,
    }).format(Math.abs(num));

    const isNegative = num < 0;

    return (
        <span className={`font-body tabular-nums block text-right ${className}`}>
            {isNegative && '−'}
            {symbol}
            {formatted}
            {showCode && <span className="text-gray-400 ml-1 text-[11px]">{currency}</span>}
        </span>
    );
}
