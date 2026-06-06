<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cash Voucher {{ $voucher->voucher_no }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt; color: #0F172A;
    padding: 28px 36px; line-height: 1.4;
  }

  .header { border-bottom: 2px solid #3F9800; padding-bottom: 12px; margin-bottom: 14px; }
  .header-top { display: flex; justify-content: space-between; }
  .company-name { font-size: 14pt; font-weight: bold; color: #3F9800; }
  .company-sub { font-size: 8pt; color: #475569; margin-top: 2px; }
  .doc-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .doc-number { font-size: 10pt; font-weight: bold; color: #3F9800; margin-top: 3px; }

  .section-label {
    font-size: 7.5pt; font-weight: bold; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.8px;
    margin-bottom: 4px; margin-top: 14px;
  }

  .info-grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .info-grid td { padding: 5px 6px; vertical-align: top; }
  .info-label { font-size: 8pt; color: #64748B; width: 100px; white-space: nowrap; }
  .info-value { font-size: 9pt; font-weight: bold; border-bottom: 1px solid #CBD5E1; min-width: 200px; }

  /* Payment details table */
  .details-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .details-table th {
    background: #F1F5F9; border: 1px solid #CBD5E1;
    padding: 6px 8px; font-size: 8.5pt; font-weight: bold; text-align: left;
  }
  .details-table td { border: 1px solid #E2E8F0; padding: 6px 8px; font-size: 8.5pt; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* Approval chain */
  .approval-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  .approval-table th {
    background: #3F9800; color: white;
    padding: 5px 8px; font-size: 8pt; font-weight: bold;
  }
  .approval-table td { border: 1px solid #E2E8F0; padding: 10px 8px; font-size: 8pt; }
  .approval-role { color: #64748B; font-size: 7.5pt; }
  .approval-name { font-weight: bold; margin-top: 2px; }
  .approval-date { color: #3F9800; font-size: 7.5pt; margin-top: 2px; }
  .sig-space { height: 30px; border-bottom: 1px solid #CBD5E1; margin-bottom: 4px; }

  /* Total */
  .total-row {
    background: #F0FDF4; border: 1.5px solid #3F9800;
    border-radius: 4px; padding: 8px 12px;
    display: flex; justify-content: space-between;
    align-items: center; margin-top: 10px;
  }
  .total-label { font-size: 9pt; font-weight: bold; }
  .total-amount { font-size: 13pt; font-weight: bold; color: #3F9800; }

  /* Received by section */
  .received-block {
    margin-top: 20px; border: 1px solid #E2E8F0;
    border-radius: 4px; padding: 10px 14px;
  }
  .received-grid { display: flex; gap: 24px; margin-top: 6px; }
  .received-item { flex: 1; }
  .received-label { font-size: 7.5pt; color: #64748B; margin-bottom: 2px; }
  .received-line { border-bottom: 1px solid #CBD5E1; height: 28px; }

  .status-badge {
    display: inline-block; padding: 2px 8px;
    border-radius: 4px; font-size: 7.5pt; font-weight: bold;
  }
  .status-pending  { background: #FEF3C7; color: #92400E; }
  .status-checked  { background: #DBEAFE; color: #1D4ED8; }
  .status-approved { background: #F0FDF4; color: #15803D; }
  .status-released { background: #F0FDF4; color: #166534; border: 1px solid #86EFAC; }

  .footer {
    margin-top: 20px; border-top: 1px solid #E2E8F0;
    padding-top: 8px; font-size: 7.5pt; color: #94A3B8; text-align: center;
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
      <div class="company-sub">{{ $company['address_main'] }}</div>
    </div>
    <div style="text-align:right;">
      <div class="doc-title">Cash Voucher</div>
      <div class="doc-number">{{ $voucher->voucher_no }}</div>
      <div style="font-size:8pt; color:#64748B; margin-top:4px;">
        Date: <strong>{{ \Carbon\Carbon::parse($voucher->date)->format('F d, Y') }}</strong>
      </div>
      <div style="margin-top:4px;">
        <span class="status-badge status-{{ $voucher->approval_status }}">
          {{ strtoupper($voucher->approval_status) }}
        </span>
      </div>
    </div>
  </div>
</div>

{{-- ── PAYEE INFORMATION ────────────────────────────────────────────────── --}}
<div class="section-label">Payee Information</div>
<table class="info-grid">
  <tr>
    <td class="info-label">Payee:</td>
    <td class="info-value" colspan="3">{{ $voucher->payee }}</td>
  </tr>
  <tr>
    <td class="info-label">Address:</td>
    <td class="info-value" colspan="3">{{ $voucher->payee_address ?? '' }}</td>
  </tr>
  <tr>
    <td class="info-label">Branch:</td>
    <td class="info-value">{{ $voucher->branch?->name ?? '' }}</td>
    <td class="info-label" style="padding-left:16px;">Currency:</td>
    <td class="info-value">{{ $voucher->currency }}</td>
  </tr>
</table>

{{-- ── PAYMENT DETAILS ──────────────────────────────────────────────────── --}}
<div class="section-label">Details of Payment</div>
<table class="details-table">
  <thead>
    <tr>
      <th>Description / Details</th>
      <th width="150">Account Code</th>
      <th width="110">Account Description</th>
      <th class="text-right" width="120">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{ $voucher->details }}</td>
      <td>{{ $voucher->account_code ?? '' }}</td>
      <td>{{ $voucher->account_description ?? '' }}</td>
      <td class="text-right">{{ $voucher->currency }} {{ number_format($voucher->amount, 2) }}</td>
    </tr>
    <tr><td colspan="4" style="height:18px;"></td></tr>
    <tr><td colspan="4" style="height:18px;"></td></tr>
  </tbody>
</table>

{{-- ── TOTAL ─────────────────────────────────────────────────────────────── --}}
@php
  $amountDisplay = $voucher->currency . ' ' . number_format($voucher->amount, 2);
  if ($voucher->amount_usd > 0) $amountDisplay .= ' (USD ' . number_format($voucher->amount_usd, 2) . ')';
  if ($voucher->amount_jpy > 0) $amountDisplay .= ' (JPY ' . number_format($voucher->amount_jpy, 0) . ')';
@endphp
<div class="total-row">
  <div class="total-label">TOTAL AMOUNT</div>
  <div class="total-amount">{{ $amountDisplay }}</div>
</div>

@if($voucher->remarks)
<div style="margin-top:8px; font-size:8pt; color:#475569;">
  <strong>Remarks:</strong> {{ $voucher->remarks }}
</div>
@endif

{{-- ── APPROVAL CHAIN ───────────────────────────────────────────────────── --}}
<div class="section-label">Approval Chain</div>
<table class="approval-table">
  <thead>
    <tr>
      <th>Prepared by</th>
      <th>Checked by (Admin Auditor)</th>
      <th>Approved by (General Manager)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div class="sig-space"></div>
        <div class="approval-role">Prepared by</div>
        <div class="approval-name">{{ $voucher->createdBy?->name ?? '' }}</div>
        <div class="approval-date">{{ $voucher->created_at?->format('m/d/Y') }}</div>
      </td>
      <td>
        <div class="sig-space"></div>
        <div class="approval-role">Checked by</div>
        <div class="approval-name">{{ $voucher->checker?->name ?? '' }}</div>
        <div class="approval-date">{{ $voucher->checked_at?->format('m/d/Y') ?? '___________' }}</div>
      </td>
      <td>
        <div class="sig-space"></div>
        <div class="approval-role">Approved by</div>
        <div class="approval-name">{{ $voucher->approver?->name ?? '' }}</div>
        <div class="approval-date">{{ $voucher->approved_at?->format('m/d/Y') ?? '___________' }}</div>
      </td>
    </tr>
  </tbody>
</table>

{{-- ── RECEIVED BY ──────────────────────────────────────────────────────── --}}
<div class="received-block">
  <div style="font-size:8pt; font-weight:bold; color:#334155;">Received by (Payee)</div>
  <div class="received-grid">
    <div class="received-item">
      <div class="received-label">Signature over Printed Name</div>
      <div class="received-line"></div>
    </div>
    <div class="received-item" style="max-width:150px;">
      <div class="received-label">Date Received</div>
      <div class="received-line"></div>
    </div>
  </div>
</div>

{{-- ── FOOTER ───────────────────────────────────────────────────────────── --}}
<div class="footer">
  This is a computer-generated Cash Voucher. · Generated: {{ $generatedAt }}
  <br>{{ $company['name'] }} · IATA Accredited · PTAA Member
</div>

</body>
</html>