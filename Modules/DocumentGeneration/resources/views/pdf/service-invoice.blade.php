<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Service Invoice {{ $transaction->document_number }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    padding: 16px 20px;
    line-height: 1.4;
  }

  /* ── Outer layout ────────────────────────────────────────────────── */
  .outer-table { width: 100%; border-collapse: collapse; }
  .left-col  { width: 42%; border: 1px solid #000; vertical-align: top; padding: 0; }
  .right-col { width: 58%; vertical-align: top; padding-left: 18px; }

  /* ── Left: particulars table ─────────────────────────────────────── */
  .settlement-header {
    background: #000; color: #fff;
    text-align: center; font-weight: bold; font-size: 9pt; padding: 5px;
  }
  .settlement-table { width: 100%; border-collapse: collapse; }
  .settlement-table th {
    background: #000; color: #fff;
    padding: 3px 6px; font-size: 8.5pt; font-weight: bold; text-align: left;
  }
  .settlement-table th.right { text-align: right; }
  .settlement-table td {
    border-bottom: 1px solid #ccc; padding: 3px 6px; font-size: 8.5pt; height: 18px;
  }
  .settlement-table td.amount { text-align: right; border-left: 1px solid #ccc; }
  .calc-table { width: 100%; border-collapse: collapse; }
  .calc-table td {
    border-bottom: 1px solid #ccc; padding: 2px 6px; font-size: 8pt; height: 16px;
  }
  .calc-table td.value { text-align: right; border-left: 1px solid #ccc; font-weight: normal; }
  .calc-table .bold td { font-weight: bold; }

  /* ── Left: form of payment section ──────────────────────────────── */
  .payment-header {
    background: #000; color: #fff;
    text-align: center; font-weight: bold; font-size: 9pt; padding: 4px 6px;
  }
  .payment-table { width: 100%; border-collapse: collapse; }
  .payment-table td {
    border-bottom: 1px solid #ccc; padding: 3px 6px; font-size: 8.5pt; height: 20px;
  }
  .payment-table td.value { border-left: 1px solid #ccc; text-align: right; }

  /* ── Right: company header ───────────────────────────────────────── */
  .company-name {
    font-size: 22pt; font-weight: bold; color: #2D6A00;
    letter-spacing: 0.3px; line-height: 1; margin-bottom: 3px;
  }
  .company-address { font-size: 8.5pt; margin-bottom: 1px; }
  .company-tin     { font-size: 8.5pt; margin-bottom: 10px; }

  /* ── Right: doc title ────────────────────────────────────────────── */
  .doc-title  { font-size: 14pt; font-weight: bold; color: #000; margin-bottom: 6px; }
  .doc-number { font-size: 14pt; font-weight: bold; color: #CC0000; float: right; margin-top: -22px; }

  /* ── Right: fields ───────────────────────────────────────────────── */
  .field-row { margin-bottom: 7px; }
  .field-label { font-size: 9pt; }
  .field-line    { border-bottom: 1px solid #000; display: inline-block; min-width: 280px; vertical-align: bottom; margin-left: 4px; }
  .field-line-sm { border-bottom: 1px solid #000; display: inline-block; min-width: 160px; vertical-align: bottom; margin-left: 4px; }
  .pesos-line {
    border-bottom: 1px solid #000; display: block; width: 100%;
    margin-top: 6px; margin-bottom: 8px; min-height: 20px;
    padding-bottom: 2px; font-weight: bold;
  }
  .amount-paren { text-align: right; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 10px; }
  .partial-line { border-bottom: 1px solid #000; display: inline-block; min-width: 220px; vertical-align: bottom; margin-left: 4px; }

  /* ── BIR footer text ──────────────────────────────────────────────── */
  .bir-footer {
    font-size: 7pt; color: #000; margin-top: 8px; line-height: 1.5;
  }

  /* ── Signature ───────────────────────────────────────────────────── */
  .sig-block { margin-top: 20px; text-align: right; }
  .sig-line-right { border-bottom: 1px solid #000; display: inline-block; min-width: 180px; min-height: 24px; vertical-align: bottom; }
  .sig-label { font-size: 8.5pt; font-weight: bold; font-style: italic; }
</style>
</head>
<body>

<table class="outer-table">
<tr>
  {{-- ── LEFT COLUMN ─────────────────────────────────────────────────── --}}
  <td class="left-col">
    <div class="settlement-header">In Settlement of the following</div>
    <table class="settlement-table">
      <thead>
        <tr>
          <th>PARTICULARS</th>
          <th class="right">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>QUANTITY</td><td class="amount">1</td></tr>
        <tr><td>UNIT COST</td><td class="amount">&#8369; {{ number_format($transaction->total_sales_vat_inclusive, 2) }}</td></tr>
        <tr><td>DESCRIPTION</td><td class="amount"></td></tr>
        <tr><td>{{ $transaction->particulars ?? 'Travel Services' }}</td><td class="amount"></td></tr>
      </tbody>
    </table>

    {{-- VAT Calculation block --}}
    <table class="calc-table">
      <tr><td>Total Sales (Vat Inclusive)</td><td class="value">&#8369; {{ number_format($transaction->total_sales_vat_inclusive, 2) }}</td></tr>
      <tr><td>Less: VAT</td><td class="value">&#8369; {{ number_format($transaction->vat_amount, 2) }}</td></tr>
      <tr><td>Total</td><td class="value">&#8369; {{ number_format($transaction->vatable_sales, 2) }}</td></tr>
      <tr><td>Less: SC/PWD Discount</td><td class="value">&#8369; {{ number_format($transaction->sc_pwd_discount, 2) }}</td></tr>
      <tr><td>Total Due</td><td class="value">&#8369; {{ number_format($transaction->total_sales_vat_inclusive - $transaction->sc_pwd_discount, 2) }}</td></tr>
      <tr><td>Less: Withholding Tax</td><td class="value">&#8369; {{ number_format($transaction->withholding_tax, 2) }}</td></tr>
      <tr><td>Amount Date</td><td class="value"></td></tr>
      <tr><td>Add: VAT</td><td class="value">&#8369; {{ number_format($transaction->vat_amount, 2) }}</td></tr>
      <tr class="bold"><td>Total Amount Due</td><td class="value">&#8369; {{ number_format($transaction->net_amount_due, 2) }}</td></tr>
      <tr><td>&nbsp;</td><td class="value"></td></tr>
      <tr><td>VATable Sales</td><td class="value">&#8369; {{ number_format($transaction->vatable_sales, 2) }}</td></tr>
      <tr><td>VAT - Exempt Sales</td><td class="value">&#8369; {{ number_format($transaction->vat_exempt_sales, 2) }}</td></tr>
      <tr><td>VAT Zero Rated Sales</td><td class="value">&#8369; {{ number_format($transaction->vat_zero_rated_sales, 2) }}</td></tr>
      <tr><td>VAT amount</td><td class="value">&#8369; {{ number_format($transaction->vat_amount, 2) }}</td></tr>
      <tr><td>Total Sales</td><td class="value">&#8369; {{ number_format($transaction->total_sales_vat_inclusive, 2) }}</td></tr>
    </table>

    {{-- Form of Payment --}}
    <div class="payment-header">Form of Payment</div>
    <table class="payment-table">
      <tr>
        <td>Cash</td>
        <td class="value">{{ $transaction->mode_of_payment === 'cash' ? '&#10003;' : '' }}</td>
      </tr>
      <tr>
        <td>Check</td>
        <td class="value">{{ $transaction->mode_of_payment === 'check' ? '&#10003;' : '' }}</td>
      </tr>
      <tr>
        <td>Bank</td>
        <td class="value">{{ $transaction->mode_of_payment === 'bank' ? '&#10003;' : '' }}</td>
      </tr>
      <tr>
        <td>Check #</td>
        <td class="value">{{ $transaction->check_number ?? '' }}</td>
      </tr>
      <tr>
        <td>Date</td>
        <td class="value">{{ $transaction->transaction_date->format('m/d/Y') }}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;">TOTAL &#8369;</td>
        <td class="value" style="font-weight:bold;">{{ number_format($transaction->gross_amount, 2) }}</td>
      </tr>
    </table>
  </td>

  {{-- ── RIGHT COLUMN ────────────────────────────────────────────────── --}}
  <td class="right-col">

    {{-- Company header --}}
    <div class="company-name">&#9992; AMKOR TRAVEL &amp; TOURS INC.</div>
    <div class="company-address">Rm 108 West City Plaza Bldg., 66 West Ave., Quezon City</div>
    <div class="company-tin">VAT Reg. TIN. {{ $transaction->branch?->code === 'ORMOC' ? $company['tin_ormoc'] : $company['tin_main'] }}</div>

    {{-- Doc title + number --}}
    <div>
      <span class="doc-title">SERVICE INVOICE</span>
      <span class="doc-number">No. {{ $transaction->document_number }}</span>
    </div>

    {{-- Date --}}
    <div class="field-row" style="margin-top:16px;">
      <span class="field-label">Date:</span>
      <span class="field-line-sm">{{ $transaction->transaction_date->format('F d, Y') }}</span>
    </div>

    {{-- Received from --}}
    <div class="field-row">
      <span class="field-label">Received from</span>
      <span class="field-line">{{ $transaction->client_name }}</span>
    </div>

    {{-- TIN + address --}}
    <div class="field-row">
      <span class="field-label">with TIN</span>
      <span class="field-line-sm">{{ $transaction->tin ?? '' }}</span>
      <span style="margin-left:8px;">and address at</span>
    </div>
    <div style="border-bottom:1px solid #000; margin-bottom:8px; min-height:18px;">{{ $transaction->address ?? '' }}</div>

    {{-- Business style --}}
    <div class="field-row">
      <span class="field-label">enganged in a business style of</span>
      <span class="field-line">{{ $transaction->business_style ?? '' }}</span>
    </div>

    {{-- Sum of pesos --}}
    <div class="field-row">
      <span class="field-label">the sum of pesos</span>
      <span class="pesos-line">{{ $amountInWords }}</span>
    </div>

    {{-- Amount in parentheses --}}
    <div class="amount-paren">
      (&#8369; {{ number_format($transaction->gross_amount, 2) }})
    </div>

    {{-- Partial/full payment --}}
    <div class="field-row">
      <span class="field-label">in Partial/Full payment of</span>
      <span class="partial-line">{{ $transaction->particulars ?? '' }}</span>
    </div>

    {{-- BIR ATP footer --}}
    <div class="bir-footer">
      30 Bklts. (50x3) 2501-4,000 &nbsp; Date Issued:{{ now()->format('m/d/y') }}<br>
      BIR Authority to Print No.: {{ $atpNumber }}<br>
      BM PRINTING &amp; BOOKBIDING &nbsp;&nbsp; TIN: 920-848-016-00000 VAT<br>
      Lopez Jaena St., Brgy. South 6541 Ormoc City Leyte Philippines<br>
      Printer's Accredation No.089MP20240000000003 Date Issued: March 21, 2024
    </div>

    {{-- Cashier signature --}}
    <div class="sig-block">
      <div>By: <span class="sig-line-right"></span></div>
      <div class="sig-label">Cashier / Authorized Signature</div>
    </div>

  </td>
</tr>
</table>

</body>
</html>
