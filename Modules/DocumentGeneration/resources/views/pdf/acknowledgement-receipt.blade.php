<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Acknowledgement Receipt {{ $transaction->document_number }}</title>
<style>
  /* ─── Reset ─────────────────────────────────────────────────────────── */
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt;
    color: #0F172A;
    padding: 28px 36px;
    line-height: 1.4;
  }

  /* ─── Header ─────────────────────────────────────────────────────────── */
  .header {
    border-bottom: 2px solid #3F9800;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .company-name {
    font-size: 14pt;
    font-weight: bold;
    color: #3F9800;
    letter-spacing: 0.3px;
  }
  .company-sub {
    font-size: 8pt;
    color: #475569;
    margin-top: 2px;
  }
  .doc-title-block {
    text-align: right;
  }
  .doc-title {
    font-size: 13pt;
    font-weight: bold;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .doc-number {
    font-size: 10pt;
    color: #3F9800;
    font-weight: bold;
    margin-top: 3px;
  }

  /* ─── Section label ───────────────────────────────────────────────────── */
  .section-label {
    font-size: 7.5pt;
    font-weight: bold;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 3px;
    margin-top: 12px;
  }

  /* ─── Client info block ───────────────────────────────────────────────── */
  .info-grid {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  .info-grid td {
    padding: 4px 6px;
    vertical-align: top;
  }
  .info-label {
    font-size: 8pt;
    color: #64748B;
    width: 110px;
    white-space: nowrap;
  }
  .info-value {
    font-size: 9pt;
    font-weight: bold;
    color: #0F172A;
    border-bottom: 1px solid #CBD5E1;
    min-width: 200px;
  }

  /* ─── Amount block ───────────────────────────────────────────────────── */
  .amount-box {
    border: 1.5px solid #3F9800;
    border-radius: 6px;
    padding: 10px 14px;
    margin-top: 14px;
    background: #F0FDF4;
  }
  .amount-label {
    font-size: 8pt;
    color: #64748B;
    margin-bottom: 4px;
  }
  .amount-words {
    font-size: 9.5pt;
    font-weight: bold;
    color: #0F172A;
    font-style: italic;
    border-bottom: 1px solid #86EFAC;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }
  .amount-figures {
    font-size: 13pt;
    font-weight: bold;
    color: #3F9800;
    text-align: right;
  }

  /* ─── Particulars / payment details ──────────────────────────────────── */
  .details-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }
  .details-table th {
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    padding: 5px 8px;
    font-size: 8.5pt;
    font-weight: bold;
    text-align: left;
    color: #334155;
  }
  .details-table td {
    border: 1px solid #E2E8F0;
    padding: 5px 8px;
    font-size: 8.5pt;
    vertical-align: top;
  }
  .text-right { text-align: right; }

  /* ─── Payment info ───────────────────────────────────────────────────── */
  .payment-block {
    margin-top: 12px;
    border: 1px solid #E2E8F0;
    padding: 8px 12px;
    border-radius: 4px;
  }
  .payment-row {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 8.5pt;
  }
  .payment-label { color: #64748B; width: 130px; flex-shrink: 0; }
  .payment-value { font-weight: bold; color: #0F172A; border-bottom: 1px solid #CBD5E1; flex: 1; }

  /* ─── Totals ─────────────────────────────────────────────────────────── */
  .totals-block {
    margin-top: 10px;
    width: 260px;
    margin-left: auto;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 8.5pt;
    border-bottom: 1px solid #F1F5F9;
  }
  .total-final {
    font-weight: bold;
    font-size: 10pt;
    color: #3F9800;
    border-top: 2px solid #3F9800;
    padding-top: 5px;
    margin-top: 3px;
  }

  /* ─── Signatures ─────────────────────────────────────────────────────── */
  .sig-block {
    margin-top: 36px;
    display: flex;
    justify-content: space-between;
  }
  .sig-item {
    text-align: center;
    width: 180px;
  }
  .sig-line {
    border-top: 1px solid #0F172A;
    margin-bottom: 4px;
    margin-top: 32px;
  }
  .sig-label {
    font-size: 8pt;
    color: #475569;
  }

  /* ─── Footer ─────────────────────────────────────────────────────────── */
  .footer {
    margin-top: 24px;
    border-top: 1px solid #E2E8F0;
    padding-top: 8px;
    font-size: 7.5pt;
    color: #94A3B8;
    text-align: center;
  }

  .badge-bir {
    display: inline-block;
    background: #EF4444;
    color: white;
    font-size: 7pt;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 6px;
    vertical-align: middle;
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
    <div class="doc-title-block">
      <div class="doc-title">Acknowledgement Receipt <span class="badge-bir">BIR</span></div>
      <div class="doc-number">{{ $transaction->document_number }}</div>
      <div style="font-size:8pt; color:#64748B; margin-top:4px;">
        Date: <strong>{{ $transaction->transaction_date->format('F d, Y') }}</strong>
      </div>
    </div>
  </div>
</div>

{{-- ── CLIENT INFORMATION ───────────────────────────────────────────────── --}}
<div class="section-label">Client Information</div>
<table class="info-grid">
  <tr>
    <td class="info-label">Received From:</td>
    <td class="info-value">{{ $transaction->client_name }}</td>
    <td width="20"></td>
    <td class="info-label">TIN:</td>
    <td class="info-value" style="color:{{ $transaction->tin ? '#0F172A' : '#EF4444' }}">
      {{ $transaction->tin ?? '— Required —' }}
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

{{-- ── AMOUNT BLOCK ─────────────────────────────────────────────────────── --}}
<div class="amount-box">
  <div class="amount-label">The sum of pesos:</div>
  <div class="amount-words">{{ $amountInWords }}</div>
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <div style="font-size:8pt; color:#15803D;">
      @if($transaction->mode_of_payment === 'check' && $transaction->check_number)
        Check No.: <strong>{{ $transaction->check_number }}</strong>
      @endif
    </div>
    <div class="amount-figures">₱ {{ number_format($transaction->gross_amount, 2) }}</div>
  </div>
</div>

{{-- ── PARTICULARS ──────────────────────────────────────────────────────── --}}
@if($transaction->particulars)
<div class="section-label">Particulars</div>
<table class="details-table">
  <thead>
    <tr>
      <th>Description</th>
      <th class="text-right" width="120">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{ $transaction->particulars }}</td>
      <td class="text-right">₱ {{ number_format($transaction->gross_amount, 2) }}</td>
    </tr>
  </tbody>
</table>
@endif

{{-- ── TOTALS ───────────────────────────────────────────────────────────── --}}
<div class="totals-block">
  <div class="total-row">
    <span>Gross Amount</span>
    <span>₱ {{ number_format($transaction->gross_amount, 2) }}</span>
  </div>
  @if($transaction->sc_pwd_discount > 0)
  <div class="total-row">
    <span>SC/PWD Discount</span>
    <span style="color:#EF4444;">- ₱ {{ number_format($transaction->sc_pwd_discount, 2) }}</span>
  </div>
  @endif
  @if($transaction->withholding_tax > 0)
  <div class="total-row">
    <span>Withholding Tax (2%)</span>
    <span style="color:#EF4444;">- ₱ {{ number_format($transaction->withholding_tax, 2) }}</span>
  </div>
  @endif
  <div class="total-row total-final">
    <span>TOTAL DUE</span>
    <span>₱ {{ number_format($transaction->net_amount_due, 2) }}</span>
  </div>
</div>

{{-- ── PAYMENT INFO ─────────────────────────────────────────────────────── --}}
<div class="payment-block" style="margin-top:14px;">
  <div style="font-size:8pt; font-weight:bold; color:#334155; margin-bottom:6px;">Form of Payment</div>
  <div class="payment-row">
    <span class="payment-label">☐ Cash</span>
    <span class="payment-label">☐ Check</span>
    <span class="payment-label">☐ Bank Transfer</span>
    <span class="payment-label">☐ Other: ___________</span>
  </div>
  <div class="payment-row" style="margin-top:6px;">
    <span class="payment-label">Check # / Reference:</span>
    <span class="payment-value">{{ $transaction->check_number ?? '' }}</span>
    <span class="payment-label" style="margin-left:16px;">Date:</span>
    <span class="payment-value">{{ $transaction->transaction_date->format('m/d/Y') }}</span>
  </div>
</div>

{{-- ── SIGNATURES ───────────────────────────────────────────────────────── --}}
<div class="sig-block">
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Cashier / Authorized Signature</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Client Signature / Received by</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Date Received</div>
  </div>
</div>

{{-- ── FOOTER ───────────────────────────────────────────────────────────── --}}
<div class="footer">
  This is a computer-generated Acknowledgement Receipt. · Generated: {{ $generatedAt }}
  <br>Amkor Travel &amp; Tours Inc. · IATA Accredited · PTAA Member
</div>

</body>
</html>