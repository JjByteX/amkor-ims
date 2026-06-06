<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Statement of Account {{ $transaction->document_number }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt; color: #0F172A;
    padding: 28px 36px; line-height: 1.4;
  }

  .header { border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 14px; }
  .header-top { display: flex; justify-content: space-between; }
  .company-name { font-size: 14pt; font-weight: bold; color: #0F172A; }
  .company-sub { font-size: 8pt; color: #475569; margin-top: 2px; }
  .doc-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .doc-number { font-size: 10pt; font-weight: bold; margin-top: 3px; }

  .section-label {
    font-size: 7.5pt; font-weight: bold; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.8px;
    margin-bottom: 4px; margin-top: 14px;
  }

  .to-block {
    border: 1px solid #E2E8F0; border-radius: 4px;
    padding: 10px 14px; margin-top: 10px; background: #F8FAFC;
  }
  .to-block .label { font-size: 8pt; color: #64748B; margin-bottom: 2px; }
  .to-block .name { font-size: 11pt; font-weight: bold; }
  .to-block .detail { font-size: 8.5pt; color: #475569; margin-top: 2px; }

  .meta-grid { display: flex; gap: 24px; margin-top: 12px; }
  .meta-item { }
  .meta-label { font-size: 7.5pt; color: #64748B; }
  .meta-value { font-size: 9pt; font-weight: bold; }

  /* Line items table */
  .items-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .items-table th {
    background: #0F172A; color: white;
    border: 1px solid #0F172A; padding: 6px 8px;
    font-size: 8.5pt; text-align: left;
  }
  .items-table td { border: 1px solid #E2E8F0; padding: 6px 8px; font-size: 8.5pt; }
  .text-right { text-align: right; }

  /* Totals */
  .total-block {
    margin-top: 8px; border-top: 2px solid #0F172A;
    padding-top: 6px; text-align: right;
  }
  .total-label { font-size: 9pt; color: #64748B; }
  .total-amount { font-size: 13pt; font-weight: bold; color: #0F172A; }
  .amount-words {
    font-size: 8.5pt; font-style: italic;
    color: #475569; margin-top: 4px;
    border-bottom: 1px solid #CBD5E1; padding-bottom: 6px;
  }

  /* Bank details */
  .bank-box {
    border: 1px solid #CBD5E1; border-radius: 6px;
    padding: 10px 14px; margin-top: 16px;
  }
  .bank-title { font-size: 8.5pt; font-weight: bold; color: #0F172A; margin-bottom: 8px; }
  .bank-table { width: 100%; border-collapse: collapse; }
  .bank-table th {
    font-size: 7.5pt; color: #64748B;
    border-bottom: 1px solid #E2E8F0;
    padding: 3px 8px; text-align: left;
  }
  .bank-table td { font-size: 8.5pt; padding: 4px 8px; border-bottom: 1px solid #F1F5F9; }
  .bank-table tr:last-child td { border-bottom: none; }

  /* Interest clause */
  .interest-clause {
    margin-top: 12px; background: #FEF2F2;
    border: 1px solid #FCA5A5; border-radius: 4px;
    padding: 8px 12px; font-size: 8pt; color: #991B1B;
    line-height: 1.5;
  }

  /* Signatures */
  .sig-block { margin-top: 36px; display: flex; justify-content: space-between; }
  .sig-item { text-align: center; width: 160px; }
  .sig-line { border-top: 1px solid #0F172A; margin-bottom: 4px; margin-top: 32px; }
  .sig-label { font-size: 8pt; color: #475569; }

  .footer {
    margin-top: 20px; border-top: 1px solid #E2E8F0;
    padding-top: 8px; font-size: 7.5pt; color: #94A3B8; text-align: center;
  }
  .acr-ref {
    margin-top: 8px; font-size: 8pt; color: #475569;
    border: 1px dashed #CBD5E1; padding: 4px 8px; border-radius: 4px;
    display: inline-block;
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
      <div class="doc-title">Statement of Account</div>
      <div class="doc-number">SOA # {{ $transaction->document_number }}</div>
      <div style="font-size:8pt; color:#64748B; margin-top:4px;">
        Date: <strong>{{ $transaction->transaction_date->format('F d, Y') }}</strong>
      </div>
      @if($transaction->due_date)
      <div style="font-size:8pt; color:#EF4444; margin-top:2px;">
        Due Date: <strong>{{ $transaction->due_date->format('F d, Y') }}</strong>
      </div>
      @endif
    </div>
  </div>
</div>

{{-- ── BILLED TO ────────────────────────────────────────────────────────── --}}
<div class="section-label">Billed To</div>
<div class="to-block">
  <div class="label">TO:</div>
  <div class="name">{{ $transaction->client_name }}</div>
  @if($transaction->address)
  <div class="detail">{{ $transaction->address }}</div>
  @endif
</div>

{{-- ── LINE ITEMS ───────────────────────────────────────────────────────── --}}
<div class="section-label">Account Statement</div>
<table class="items-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Particulars</th>
      <th class="text-right" width="130">Amount</th>
      <th class="text-right" width="130">Total Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{ $transaction->transaction_date->format('m/d/Y') }}</td>
      <td>{{ $transaction->particulars ?? 'Travel Services Rendered' }}</td>
      <td class="text-right">₱ {{ number_format($transaction->gross_amount, 2) }}</td>
      <td class="text-right">₱ {{ number_format($transaction->gross_amount, 2) }}</td>
    </tr>
    <tr><td colspan="4" style="height:20px;"></td></tr>
    <tr><td colspan="4" style="height:20px;"></td></tr>
    <tr><td colspan="4" style="height:20px;"></td></tr>
  </tbody>
</table>

{{-- ── TOTAL ─────────────────────────────────────────────────────────────── --}}
<div class="total-block">
  <div class="total-label">TOTAL AMOUNT DUE</div>
  <div class="total-amount">₱ {{ number_format($transaction->gross_amount, 2) }}</div>
</div>
<div class="amount-words" style="margin-top:8px; text-align:left;">
  Amount in words: <em>{{ $amountInWords }}</em>
</div>

@if($transaction->particulars && str_contains(strtolower($transaction->particulars), 'acr'))
<div class="acr-ref">ACR Reference: {{ $transaction->particulars }}</div>
@endif

{{-- ── BANK DETAILS (required on all SOAs) ────────────────────────────── --}}
<div class="bank-box">
  <div class="bank-title">💳 Payment may be deposited to any of the following bank accounts:</div>
  <table class="bank-table">
    <thead>
      <tr>
        <th>Bank</th>
        <th>Currency</th>
        <th>Account Name</th>
        <th>Account Number</th>
      </tr>
    </thead>
    <tbody>
      @foreach($bankDetails as $bank)
      <tr>
        <td>{{ $bank['bank'] }}</td>
        <td>{{ $bank['currency'] }}</td>
        <td>{{ $bank['account_name'] }}</td>
        <td><strong>{{ $bank['account_number'] }}</strong></td>
      </tr>
      @endforeach
    </tbody>
  </table>
</div>

{{-- ── INTEREST CLAUSE (required on all SOAs per requirements) ────────── --}}
<div class="interest-clause">
  <strong>Interest Clause:</strong> In case of delay in payment, an interest rate of <strong>36% per annum</strong>
  shall be charged on the outstanding balance. In case of litigation, the client agrees to pay
  <strong>15% of the outstanding amount as attorney's fees</strong>, plus costs of litigation.
</div>

{{-- ── SIGNATURES ───────────────────────────────────────────────────────── --}}
<div class="sig-block">
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Checked by</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Approved by</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Received by</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-label">Date Received</div>
  </div>
</div>

{{-- ── FOOTER ───────────────────────────────────────────────────────────── --}}
<div class="footer">
  This is a computer-generated Statement of Account. · Generated: {{ $generatedAt }}
  <br>{{ $company['name'] }} · IATA Accredited · PTAA Member
</div>

</body>
</html>