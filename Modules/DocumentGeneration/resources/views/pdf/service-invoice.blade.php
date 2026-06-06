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
    color: #0F172A;
    padding: 28px 36px;
    line-height: 1.4;
  }

  .header { border-bottom: 2px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 14px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .company-name { font-size: 14pt; font-weight: bold; color: #1D4ED8; }
  .company-sub { font-size: 8pt; color: #475569; margin-top: 2px; }
  .doc-title { font-size: 13pt; font-weight: bold; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; }
  .doc-number { font-size: 10pt; color: #1D4ED8; font-weight: bold; margin-top: 3px; }
  .atp-badge {
    background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 4px;
    padding: 3px 8px; font-size: 7.5pt; font-weight: bold; color: #92400E;
    margin-top: 4px; display: inline-block;
  }

  .section-label {
    font-size: 7.5pt; font-weight: bold; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.8px;
    margin-bottom: 3px; margin-top: 12px;
  }

  .info-grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .info-grid td { padding: 4px 6px; vertical-align: top; }
  .info-label { font-size: 8pt; color: #64748B; width: 110px; white-space: nowrap; }
  .info-value { font-size: 9pt; font-weight: bold; border-bottom: 1px solid #CBD5E1; min-width: 200px; }

  /* Particulars table */
  .details-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .details-table th {
    background: #1D4ED8; color: white;
    border: 1px solid #1D4ED8; padding: 5px 8px;
    font-size: 8.5pt; font-weight: bold; text-align: left;
  }
  .details-table td { border: 1px solid #E2E8F0; padding: 5px 8px; font-size: 8.5pt; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* VAT breakdown box — THE KEY BIR-CRITICAL SECTION */
  .vat-box {
    border: 2px solid #1D4ED8; border-radius: 6px;
    padding: 10px 14px; margin-top: 14px;
  }
  .vat-title {
    font-size: 9pt; font-weight: bold; color: #1D4ED8;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid #BFDBFE; padding-bottom: 6px; margin-bottom: 8px;
  }
  .vat-grid { width: 100%; border-collapse: collapse; }
  .vat-grid td { padding: 4px 8px; font-size: 8.5pt; border-bottom: 1px solid #F1F5F9; }
  .vat-label { color: #475569; width: 200px; }
  .vat-value { font-weight: bold; text-align: right; width: 120px; }
  .vat-total { font-size: 9.5pt; font-weight: bold; color: #1D4ED8; }

  /* Summary totals */
  .totals-block { margin-top: 10px; width: 280px; margin-left: auto; }
  .total-row {
    display: flex; justify-content: space-between;
    padding: 3px 0; font-size: 8.5pt;
    border-bottom: 1px solid #F1F5F9;
  }
  .total-final {
    font-weight: bold; font-size: 10pt; color: #1D4ED8;
    border-top: 2px solid #1D4ED8; padding-top: 5px; margin-top: 3px;
  }

  .sig-block { margin-top: 36px; display: flex; justify-content: space-between; }
  .sig-item { text-align: center; width: 180px; }
  .sig-line { border-top: 1px solid #0F172A; margin-bottom: 4px; margin-top: 32px; }
  .sig-label { font-size: 8pt; color: #475569; }

  .footer {
    margin-top: 24px; border-top: 1px solid #E2E8F0;
    padding-top: 8px; font-size: 7.5pt; color: #94A3B8; text-align: center;
  }
  .badge-bir {
    display: inline-block; background: #EF4444; color: white;
    font-size: 7pt; font-weight: bold; padding: 2px 6px;
    border-radius: 3px; margin-left: 6px;
  }
</style>
</head>
<body>

{{-- ── HEADER ──────────────────────────────────────────────────────────── --}}
<div class="header">
  <div class="header-top">
    <div>
      <div class="company-name">{{ $company['name'] }}</div>
      <div class="company-sub">IATA Accredited · PTAA Member</div>
      <div class="company-sub">TIN: {{ $transaction->branch?->code === 'ORMOC' ? $company['tin_ormoc'] : $company['tin_main'] }}</div>
      <div class="company-sub">
        {{ $transaction->branch?->code === 'ORMOC' ? $company['address_ormoc'] : $company['address_main'] }}
      </div>
    </div>
    <div style="text-align:right;">
      <div class="doc-title">Service Invoice <span class="badge-bir">BIR</span></div>
      <div class="doc-number">{{ $transaction->document_number }}</div>
      <div class="atp-badge">BIR Authority to Print No.: {{ $atpNumber }}</div>
      <div style="font-size:8pt; color:#64748B; margin-top:6px;">
        Date: <strong>{{ $transaction->transaction_date->format('F d, Y') }}</strong>
      </div>
    </div>
  </div>
</div>

{{-- ── CLIENT INFO ─────────────────────────────────────────────────────── --}}
<div class="section-label">Billed To</div>
<table class="info-grid">
  <tr>
    <td class="info-label">Name:</td>
    <td class="info-value">{{ $transaction->client_name }}</td>
    <td width="20"></td>
    <td class="info-label">TIN:</td>
    <td class="info-value" style="color:{{ $transaction->tin ? '#0F172A' : '#EF4444' }}">
      {{ $transaction->tin ?? '— Required for BIR —' }}
    </td>
  </tr>
  <tr>
    <td class="info-label">Address:</td>
    <td class="info-value" colspan="4">{{ $transaction->address ?? '' }}</td>
  </tr>
  <tr>
    <td class="info-label">Business Style:</td>
    <td class="info-value">{{ $transaction->business_style ?? '' }}</td>
    <td width="20"></td>
    <td class="info-label">Mode of Payment:</td>
    <td class="info-value">{{ strtoupper($transaction->mode_of_payment ?? '') }}</td>
  </tr>
</table>

{{-- ── AMOUNT IN WORDS ──────────────────────────────────────────────────── --}}
<div style="margin-top:12px; font-size:8pt; color:#64748B;">Sum of pesos:</div>
<div style="font-size:9pt; font-weight:bold; font-style:italic; border-bottom:1px solid #CBD5E1; padding-bottom:4px; margin-bottom:10px;">
  {{ $amountInWords }}
</div>

{{-- ── PARTICULARS ──────────────────────────────────────────────────────── --}}
<div class="section-label">Particulars</div>
<table class="details-table">
  <thead>
    <tr>
      <th>Qty</th>
      <th>Description</th>
      <th class="text-right" width="110">Unit Cost</th>
      <th class="text-right" width="110">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-center">1</td>
      <td>{{ $transaction->particulars ?? 'Professional Travel Services' }}</td>
      <td class="text-right">₱ {{ number_format($transaction->total_sales_vat_inclusive, 2) }}</td>
      <td class="text-right">₱ {{ number_format($transaction->total_sales_vat_inclusive, 2) }}</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Total Sales (VAT Inclusive)</td>
      <td class="text-right" style="font-weight:bold;">₱ {{ number_format($transaction->total_sales_vat_inclusive, 2) }}</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Less: VAT ({{ $vatRate }}%)</td>
      <td class="text-right" style="color:#EF4444;">- ₱ {{ number_format($transaction->vat_amount, 2) }}</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Total (VAT Exclusive)</td>
      <td class="text-right" style="font-weight:bold;">₱ {{ number_format($transaction->vatable_sales, 2) }}</td>
    </tr>
    @if($transaction->sc_pwd_discount > 0)
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Less SC/PWD Discount</td>
      <td class="text-right" style="color:#EF4444;">- ₱ {{ number_format($transaction->sc_pwd_discount, 2) }}</td>
    </tr>
    @endif
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Total Due</td>
      <td class="text-right">₱ {{ number_format($transaction->total_sales_vat_inclusive - $transaction->sc_pwd_discount, 2) }}</td>
    </tr>
    @if($transaction->withholding_tax > 0)
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Less Withholding Tax (2%)</td>
      <td class="text-right" style="color:#EF4444;">- ₱ {{ number_format($transaction->withholding_tax, 2) }}</td>
    </tr>
    @endif
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Amount Due</td>
      <td class="text-right">₱ {{ number_format($transaction->net_amount_due + $transaction->vat_amount, 2) }}</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td class="text-right" style="font-size:8pt; color:#64748B;">Add VAT</td>
      <td class="text-right">₱ {{ number_format($transaction->vat_amount, 2) }}</td>
    </tr>
    <tr style="background:#EFF6FF;">
      <td colspan="2"></td>
      <td class="text-right" style="font-weight:bold; font-size:9pt; color:#1D4ED8;">TOTAL AMOUNT DUE</td>
      <td class="text-right" style="font-weight:bold; font-size:10pt; color:#1D4ED8;">
        ₱ {{ number_format($transaction->net_amount_due, 2) }}
      </td>
    </tr>
  </tbody>
</table>

{{-- ── VAT BREAKDOWN (BIR-REQUIRED) ────────────────────────────────────── --}}
<div class="vat-box">
  <div class="vat-title">BIR VAT Summary — ATP No. {{ $atpNumber }}</div>
  <table class="vat-grid">
    <tr>
      <td class="vat-label">VATAble Sales</td>
      <td class="vat-value">₱ {{ number_format($transaction->vatable_sales, 2) }}</td>
      <td width="30"></td>
      <td class="vat-label">VAT-Exempt Sales</td>
      <td class="vat-value">₱ {{ number_format($transaction->vat_exempt_sales, 2) }}</td>
    </tr>
    <tr>
      <td class="vat-label">VAT Zero-Rated Sales</td>
      <td class="vat-value">₱ {{ number_format($transaction->vat_zero_rated_sales, 2) }}</td>
      <td width="30"></td>
      <td class="vat-label">VAT Amount (12%)</td>
      <td class="vat-value">₱ {{ number_format($transaction->vat_amount, 2) }}</td>
    </tr>
    <tr>
      <td class="vat-label vat-total" colspan="4" style="border-top:2px solid #BFDBFE; padding-top:6px;">
        Total Sales (VAT Inclusive)
      </td>
      <td class="vat-value vat-total" style="border-top:2px solid #BFDBFE; padding-top:6px;">
        ₱ {{ number_format($transaction->total_sales_vat_inclusive, 2) }}
      </td>
    </tr>
  </table>
</div>

{{-- ── SIGNATURES ───────────────────────────────────────────────────────── --}}
<div class="sig-block">
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Prepared by</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Cashier / Authorized Signature</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Client Signature / Received by</div>
  </div>
</div>

{{-- ── FOOTER ───────────────────────────────────────────────────────────── --}}
<div class="footer">
  This is a computer-generated Service Invoice. · Generated: {{ $generatedAt }}
  <br>{{ $company['name'] }} · BIR Authority to Print No.: {{ $atpNumber }} · IATA Accredited · PTAA Member
</div>

</body>
</html>