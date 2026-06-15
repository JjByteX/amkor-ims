<?php

namespace Modules\BirCompliance\Models;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BirTransaction extends Model
{
    use SoftDeletes;

    protected $table = 'bir_transactions';

    protected $fillable = [
        'source_type',
        'source_id',
        'document_type',
        'document_number',
        'client_name',
        'tin',
        'address',
        'business_style',
        'gross_amount',
        'vatable_sales',
        'vat_exempt_sales',
        'vat_zero_rated_sales',
        'vat_amount',
        'total_sales_vat_inclusive',
        'sc_pwd_discount',
        'withholding_tax',
        'net_amount_due',
        'mode_of_payment',
        'check_number',
        'transaction_date',
        'due_date',
        'year',
        'month',
        'branch_code',
        'pdf_generated',
        'pdf_generated_at',
        'pdf_path',
        'bir_atp_number',
        'particulars',
        'line_items',       // Gap #6 — JSON array of { date, description, amount }
        'remarks',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'transaction_date'         => 'date',
        'due_date'                 => 'date',
        'gross_amount'             => 'decimal:2',
        'vatable_sales'            => 'decimal:2',
        'vat_exempt_sales'         => 'decimal:2',
        'vat_zero_rated_sales'     => 'decimal:2',
        'vat_amount'               => 'decimal:2',
        'total_sales_vat_inclusive'=> 'decimal:2',
        'sc_pwd_discount'          => 'decimal:2',
        'withholding_tax'          => 'decimal:2',
        'net_amount_due'           => 'decimal:2',
        'pdf_generated'            => 'boolean',
        'pdf_generated_at'         => 'datetime',
        'line_items'               => 'array',  // Gap #6 — auto-cast JSON ↔ PHP array
    ];

    // ─── Boot ────────────────────────────────────────────────────────────────

    /**
     * Gap #6 — Keep gross_amount in sync with line_items total on every save.
     *
     * For AR and SI records line_items will be null, so gross_amount is set
     * directly as before and this hook is a no-op.
     *
     * For SOA records, gross_amount is always recomputed from line_items so
     * the two can never drift apart.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (self $tx): void {
            if ($tx->document_type === 'SOA' && ! empty($tx->line_items)) {
                $total = collect($tx->line_items)->sum(fn ($row) => (float) ($row['amount'] ?? 0));
                $tx->gross_amount = round($total, 2);
            }
        });
    }

    // ─── Constants ──────────────────────────────────────────────────────────

    public const DOCUMENT_TYPES = [
        'AR'  => 'Acknowledgement Receipt',
        'SI'  => 'Service Invoice',
        'SOA' => 'Statement of Account',
    ];

    /** BIR Authority to Print — from requirements 4.12 */
    public const BIR_ATP_NUMBER = '089AU2025';

    /** Standard VAT rate in Philippines */
    public const VAT_RATE = 0.12;

    /** Standard withholding tax rate for travel agencies */
    public const WHT_RATE = 0.02;

    public const SOURCE_TYPES = [
        'booking'    => 'Reservation / Booking',
        'visa'       => 'Visa & Documentation',
        'ormoc'      => 'Ormoc Branch',
        'collectible'=> 'Accounts Receivable',
        'manual'     => 'Manual Entry',
    ];

    public const PAYMENT_MODES = [
        'cash'      => 'Cash',
        'bdo'       => 'BDO',
        'bpi'       => 'BPI',
        'metrobank' => 'Metrobank',
        'card'      => 'Credit/Debit Card',
        'check'     => 'Check',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForYear($query, ?int $year)
    {
        return $year ? $query->where('year', $year) : $query;
    }

    public function scopeForMonth($query, ?int $month)
    {
        return $month ? $query->where('month', $month) : $query;
    }

    public function scopeForDocumentType($query, ?string $type)
    {
        return $type ? $query->where('document_type', $type) : $query;
    }

    public function scopeForBranch($query, ?int $branchId)
    {
        return $branchId ? $query->where('branch_id', $branchId) : $query;
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('client_name', 'ilike', "%{$term}%")
                ->orWhere('tin', 'ilike', "%{$term}%")
                ->orWhere('document_number', 'ilike', "%{$term}%")
                ->orWhere('particulars', 'ilike', "%{$term}%");
        });
    }

    public function scopeBirRelevant($query)
    {
        return $query->whereIn('document_type', ['AR', 'SI']);
    }

    // ─── Helpers / Computed ──────────────────────────────────────────────────

    /**
     * Gap #6 — Return line_items padded to $count rows.
     *
     * The SOA blade iterates exactly 15 rows. This ensures we always get
     * exactly that many, with empty rows at the bottom to fill the table.
     *
     * @return array<int, array{date: string, description: string, amount: float}>
     */
    public function paddedLineItems(int $count = 15): array
    {
        $items = $this->line_items ?? [];

        $empty = ['date' => '', 'description' => '', 'amount' => null];

        while (count($items) < $count) {
            $items[] = $empty;
        }

        return array_slice($items, 0, $count);
    }

    /**
     * Compute VAT breakdown from a gross (VAT-inclusive) amount.
     * Returns array ready to fill model fields.
     */
    public static function computeVatBreakdown(
        float $grossAmount,
        bool $vatExempt = false,
        bool $vatZeroRated = false,
        float $scPwdDiscount = 0,
        float $withholdingTax = 0
    ): array {
        if ($vatExempt) {
            $vatableSales      = 0;
            $vatExemptSales    = $grossAmount;
            $vatZeroRatedSales = 0;
            $vatAmount         = 0;
            $totalVatInclusive = $grossAmount;
        } elseif ($vatZeroRated) {
            $vatableSales      = 0;
            $vatExemptSales    = 0;
            $vatZeroRatedSales = $grossAmount;
            $vatAmount         = 0;
            $totalVatInclusive = $grossAmount;
        } else {
            $vatableSales      = round($grossAmount / (1 + self::VAT_RATE), 2);
            $vatExemptSales    = 0;
            $vatZeroRatedSales = 0;
            $vatAmount         = round($grossAmount - $vatableSales, 2);
            $totalVatInclusive = $grossAmount;
        }

        $totalAfterDiscount = $totalVatInclusive - $scPwdDiscount;
        $netAmountDue       = $totalAfterDiscount - $withholdingTax;

        return [
            'vatable_sales'              => $vatableSales,
            'vat_exempt_sales'           => $vatExemptSales,
            'vat_zero_rated_sales'       => $vatZeroRatedSales,
            'vat_amount'                 => $vatAmount,
            'total_sales_vat_inclusive'  => $totalVatInclusive,
            'sc_pwd_discount'            => $scPwdDiscount,
            'withholding_tax'            => $withholdingTax,
            'net_amount_due'             => max(0, $netAmountDue),
        ];
    }

    /**
     * Generate next document number in the format: AR-2026-00001
     */
    public static function nextDocumentNumber(string $type): string
    {
        $year = now()->year;
        $last = static::where('document_type', $type)
            ->whereYear('created_at', $year)
            ->max('id') ?? 0;

        return sprintf('%s-%d-%05d', $type, $year, $last + 1);
    }

    /**
     * Convert a numeric amount to Filipino peso words.
     * e.g. 1250.50 → "One Thousand Two Hundred Fifty Pesos and Fifty Centavos"
     */
    public static function amountInWords(float $amount): string
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        $convertGroup = function (int $n) use ($ones, $tens): string {
            if ($n === 0) {
                return '';
            }
            if ($n < 20) {
                return $ones[$n];
            }
            if ($n < 100) {
                return $tens[(int) ($n / 10)].($n % 10 ? ' '.$ones[$n % 10] : '');
            }

            return $ones[(int) ($n / 100)].' Hundred'.($n % 100 ? ' '.($n < 120 ? $ones[$n % 100] : $tens[(int) (($n % 100) / 10)].(($n % 10) ? ' '.$ones[$n % 10] : '')) : '');
        };

        [$pesos, $centavos] = explode('.', number_format($amount, 2, '.', ''));
        $pesos = (int) str_replace(',', '', $pesos);

        $words = '';
        if ($pesos >= 1_000_000) {
            $words .= $convertGroup((int) ($pesos / 1_000_000)).' Million ';
            $pesos %= 1_000_000;
        }
        if ($pesos >= 1_000) {
            $words .= $convertGroup((int) ($pesos / 1_000)).' Thousand ';
            $pesos %= 1_000;
        }
        $words .= $convertGroup($pesos);
        $words  = trim($words).' Pesos';

        $centavos = (int) $centavos;
        $words   .= $centavos > 0
            ? ' and '.$convertGroup($centavos).' Centavos'
            : ' Only';

        return $words;
    }
}
