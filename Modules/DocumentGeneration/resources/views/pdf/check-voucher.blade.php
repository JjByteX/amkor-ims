<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Check Voucher {{ $voucher->voucher_no }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    padding: 20px 28px;
    line-height: 1.4;
  }

  /* ── Company header ──────────────────────────────────────────────── */
  .company-name {
    font-size: 26pt;
    font-weight: bold;
    color: #2D6A00;
    letter-spacing: 0.3px;
    line-height: 1;
    margin-bottom: 6px;
  }
  .branch-row { font-size: 7.5pt; margin-bottom: 12px; }
  .branch-col { display: inline-block; width: 32%; vertical-align: top; padding-right: 8px; }

  /* ── CV title row ────────────────────────────────────────────────── */
  .cv-title { font-size: 22pt; font-weight: bold; display: inline; }
  .cv-date  { font-size: 11pt; display: inline; margin-left: 20px; }
  .cv-no    { font-size: 14pt; font-weight: bold; float: right; margin-top: 2px; }

  /* ── Main table ──────────────────────────────────────────────────── */
  .main-table { width: 100%; border-collapse: collapse; margin-top: 12px; border: 2px solid #000; }
  .main-table td, .main-table th {
    border: 1px solid #000; padding: 6px 8px; font-size: 9pt;
  }
  .main-table .header-row th {
    font-weight: bold; text-align: center; font-size: 10pt; background: #fff;
  }
  .main-table .label-cell { font-weight: bold; }
  .main-table .empty-row td { height: 22px; }
  .main-table .account-header th {
    font-weight: bold; text-align: center; background: #fff;
  }
  .main-table .sig-row td { height: 28px; padding: 4px 8px; font-size: 8.5pt; }
  .amount-col   { width: 110px; text-align: right; }
  .checkno-col  { width: 100px; text-align: center; }

  /* ── Received from / signature ───────────────────────────────────── */
  .received-table { width: 100%; border-collapse: collapse; margin-top: 8px; border: 2px solid #000; }
  .received-table td { padding: 8px 12px; font-size: 9pt; }
  .underline-field { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; vertical-align: bottom; }
  .sig-line { border-bottom: 1px solid #000; display: block; min-height: 28px; width: 160px; }
</style>
</head>
<body>

{{-- ── COMPANY HEADER ─────────────────────────────────────────────────── --}}
<div class="company-name">&#9992; AMKOR TRAVEL &amp; TOURS INC.</div>

{{-- ── BRANCH ADDRESSES ────────────────────────────────────────────────── --}}
<div class="branch-row">
  <div class="branch-col">
    Suite 108 West City Plaza Bldg. #66<br>
    West Avenue, Quezon City, Philippines<br>
    Tel. No: (632) 8252 6291 Mobile: 0917-8172003 /<br>
    0917-1260207 / 0917-8472006 / 0917-1255280
  </div>
  <div class="branch-col">
    Suite 107 West City Plaza Bldg. #66<br>
    West Avenue, Quezon City, Philippines<br>
    Tel. No: (632) 7002-9441<br>
    Mobile: 0917-3178472 / 0956-45788902
  </div>
  <div class="branch-col">
    Unit 315 Robinsons Place Ormoc<br>
    Cogon, Ormoc City Leyte, Philippines<br>
    Tel. No: (053) 839-9304<br>
    Mobile: 0917-8172003 / 0977-2364498
  </div>
</div>

{{-- ── CV TITLE + DATE + NUMBER ─────────────────────────────────────────── --}}
<div style="clear:both; margin-bottom:4px;">
  <span class="cv-no">CV No.: {{ $voucher->voucher_no }}</span>
  <span class="cv-title">CHECK VOUCHER</span>
  <span class="cv-date">
    {{ \Carbon\Carbon::parse($voucher->date)->format('F') }}, 20{{ \Carbon\Carbon::parse($voucher->date)->format('y') }}
  </span>
</div>

{{-- ── MAIN TABLE ──────────────────────────────────────────────────────── --}}
<table class="main-table">
  {{-- Payee + Address --}}
  <tr>
    <td class="label-cell" style="width:60px;">PAYEE:</td>
    <td style="border-right: 2px solid #000;">{{ $voucher->payee }}</td>
    <td class="label-cell" style="width:80px;">ADDRESS:</td>
    <td colspan="2">{{ $voucher->payee_address ?? '' }}</td>
  </tr>

  {{-- Details of Payment / Check No. / Amount header --}}
  <tr class="header-row">
    <th colspan="3" style="text-align:center; border-right: 2px solid #000;">DETAILS OF PAYMENT</th>
    <th class="checkno-col" style="border-right: 1px solid #000;">CHECK NO.</th>
    <th class="amount-col">AMOUNT</th>
  </tr>

  {{-- Payment detail rows --}}
  <tr>
    <td colspan="3" style="border-right: 2px solid #000;">{{ $voucher->details }}</td>
    <td class="checkno-col" style="border-right: 1px solid #000; text-align:center;">{{ $voucher->check_no ?? '' }}</td>
    <td class="amount-col">
      @if($voucher->currency === 'PHP')
        &#8369; {{ number_format($voucher->amount, 2) }}
      @else
        {{ $voucher->currency }} {{ number_format($voucher->amount, 2) }}
      @endif
    </td>
  </tr>
  @for ($i = 0; $i < 4; $i++)
  <tr class="empty-row">
    <td colspan="3" style="border-right: 2px solid #000;"></td>
    <td class="checkno-col" style="border-right: 1px solid #000;"></td>
    <td class="amount-col"></td>
  </tr>
  @endfor

  {{-- Account Description / Account Number header --}}
  <tr class="account-header">
    <th colspan="3" style="text-align:center; border-right: 2px solid #000;">ACCOUNT DESCRIPTION</th>
    <th colspan="2" class="amount-col" style="text-align:center;">ACCOUNT NUMBER</th>
  </tr>
  <tr class="empty-row">
    <td colspan="3" style="border-right: 2px solid #000;">{{ $voucher->account_description ?? '' }}</td>
    <td colspan="2">{{ $voucher->account_code ?? '' }}</td>
  </tr>
  @for ($i = 0; $i < 2; $i++)
  <tr class="empty-row">
    <td colspan="3" style="border-right: 2px solid #000;"></td>
    <td colspan="2"></td>
  </tr>
  @endfor

  {{-- Prepared / Checked / Approved --}}
  <tr class="sig-row">
    <td style="border-right: 1px solid #000; font-weight:bold; font-size:7.5pt; width:33%;">
      PREPARED BY: {{ $voucher->createdBy?->name ?? '' }}
    </td>
    <td style="border-right: 2px solid #000; font-weight:bold; font-size:7.5pt; width:33%;">
      CHECKED BY: {{ $voucher->checker?->name ?? '' }}
    </td>
    <td colspan="3" style="font-weight:bold; font-size:7.5pt;">
      APPROVED BY: {{ $voucher->approver?->name ?? '' }}
    </td>
  </tr>
</table>

{{-- ── RECEIVED FROM SECTION ───────────────────────────────────────────── --}}
<table class="received-table">
  <tr>
    <td style="width:55%;">
      Received from:
      <span class="underline-field" style="min-width:160px; font-weight:bold;">
        AMKOR TRAVEL &amp; TOURS INC.
      </span>
      &nbsp; The amount of (Pesos):
      <span class="underline-field">{{ $amountInWords ?? '' }}</span>
    </td>
    <td style="width:22%; text-align:center; border-left:1px solid #000;">
      <div class="sig-line"></div>
      <div style="font-size:8pt;">Date Received</div>
    </td>
    <td style="width:23%; text-align:center; border-left:1px solid #000;">
      <div class="sig-line"></div>
      <div style="font-size:8pt;">Received by</div>
    </td>
  </tr>
</table>

</body>
</html>
