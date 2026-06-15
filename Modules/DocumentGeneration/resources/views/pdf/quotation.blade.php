<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quotation {{ $booking->booking_no }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    padding: 24px 30px;
    line-height: 1.4;
  }

  /* ── Header bar ─────────────────────────────────────────────────── */
  .header-bar {
    background: #2D6A00;
    color: white;
    padding: 10px 16px 8px 16px;
    margin-bottom: 0;
  }
  .header-bar .company-name {
    font-size: 20pt;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  /* ── Branch info strip ──────────────────────────────────────────── */
  .branch-strip {
    border-top: 3px solid #7DC24B;
    border-bottom: 3px solid #7DC24B;
    margin-bottom: 14px;
  }

  /* ── Doc title ──────────────────────────────────────────────────── */
  .doc-title {
    text-align: center;
    font-size: 16pt;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 8pt;
    color: #555;
    margin-bottom: 14px;
  }

  /* ── Info grid ──────────────────────────────────────────────────── */
  .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .info-grid td { padding: 3px 4px; font-size: 9pt; vertical-align: bottom; }
  .info-grid .label { width: 120px; font-weight: bold; color: #333; }
  .info-grid .field-line {
    border-bottom: 1px solid #000;
    min-width: 180px;
    padding-bottom: 1px;
  }
  .info-grid .spacer { width: 30px; }

  /* ── Section label ──────────────────────────────────────────────── */
  .section-label {
    background: #2D6A00;
    color: #fff;
    font-weight: bold;
    font-size: 8.5pt;
    padding: 4px 10px;
    margin-bottom: 0;
    letter-spacing: 0.5px;
  }

  /* ── Services table ─────────────────────────────────────────────── */
  .services-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .services-table th {
    border: 1px solid #000;
    padding: 5px 8px;
    font-size: 8.5pt;
    text-align: center;
    font-weight: bold;
    background: #f5f5f5;
  }
  .services-table td {
    border: 1px solid #000;
    padding: 4px 8px;
    font-size: 9pt;
    height: 18px;
    vertical-align: top;
  }
  .services-table .qty-col    { width: 45px;  text-align: center; }
  .services-table .unit-col   { width: 100px; text-align: right; }
  .services-table .total-col  { width: 110px; text-align: right; }
  .services-table .total-row td {
    font-weight: bold;
    border-top: 2px solid #000;
    background: #f9f9f9;
  }

  /* ── Terms section ──────────────────────────────────────────────── */
  .terms-box {
    border: 1px solid #ccc;
    padding: 8px 12px;
    font-size: 8pt;
    margin-bottom: 10px;
    line-height: 1.6;
  }
  .terms-box .terms-title {
    font-weight: bold;
    font-size: 8.5pt;
    margin-bottom: 4px;
    color: #2D6A00;
  }

  /* ── Validity notice ─────────────────────────────────────────────── */
  .validity-note {
    font-size: 8pt;
    font-style: italic;
    color: #CC0000;
    margin-bottom: 12px;
    text-align: center;
  }

  /* ── Signature block ─────────────────────────────────────────────── */
  .sig-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .sig-table td { padding: 2px 10px; font-size: 9pt; }
  .sig-line { border-bottom: 1px solid #000; display: block; margin-bottom: 3px; min-height: 22px; }

  /* ── Bank details ───────────────────────────────────────────────── */
  .bank-section { margin-top: 10px; font-size: 7.5pt; }
  .bank-section .bank-title { font-weight: bold; font-size: 8pt; margin-bottom: 4px; }
  .bank-cols { display: table; width: 100%; }
  .bank-col  { display: table-cell; width: 50%; vertical-align: top; padding-right: 16px; }
</style>
</head>
<body>

{{-- ── HEADER BAR ─────────────────────────────────────────────────────── --}}
<div class="header-bar">
  <span style="float:right; font-size:7pt; opacity:0.85;">IATA &nbsp;·&nbsp; PTAA</span>
  <div class="company-name">&#9992; AMKOR TRAVEL &amp; TOURS INC.</div>
</div>

{{-- ── BRANCH STRIP ────────────────────────────────────────────────────── --}}
<div class="branch-strip">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:33%; padding:5px 10px; border-right:1px solid #ccc; text-align:center; font-size:7.5pt; vertical-align:top;">
        <div style="font-weight:bold; color:#2D6A00; text-decoration:underline; margin-bottom:2px;">MAIN BRANCH</div>
        Suite 108 West City Plaza Bldg. #66<br>
        West Avenue, Quezon City, Philippines<br>
        Tel. No: (632) 8252 6291 Mobile: 0917-8172003 /<br>
        0917-1260207 / 0917-8472006 / 0917-1255280
      </td>
      <td style="width:33%; padding:5px 10px; border-right:1px solid #ccc; text-align:center; font-size:7.5pt; vertical-align:top;">
        <div style="font-weight:bold; color:#2D6A00; text-decoration:underline; margin-bottom:2px;">VISA CENTRE</div>
        Suite 107 West City Plaza Bldg. #66<br>
        West Avenue, Quezon City, Philippines<br>
        Tel. No: (632) 7002-9441<br>
        Mobile: 0917-3178472 / 0956-45788902
      </td>
      <td style="width:34%; padding:5px 10px; text-align:center; font-size:7.5pt; vertical-align:top;">
        <div style="font-weight:bold; color:#2D6A00; text-decoration:underline; margin-bottom:2px;">ORMOC BRANCH</div>
        Unit 315 Robinsons Place Ormoc<br>
        Cogon, Ormoc City Leyte, Philippines<br>
        Tel. No: (053) 839-9304<br>
        Mobile: 0917-8172003 / 0977-2364498
      </td>
    </tr>
  </table>
</div>

{{-- ── DOC TITLE ───────────────────────────────────────────────────────── --}}
<div class="doc-title">TRAVEL QUOTATION</div>
<div class="doc-subtitle">This is a quotation only and does not constitute a confirmed booking.</div>

{{-- ── CLIENT / BOOKING INFO ───────────────────────────────────────────── --}}
<table class="info-grid">
  <tr>
    <td class="label">Quotation No.:</td>
    <td class="field-line" style="font-weight:bold;">{{ $quotationNumber }}</td>
    <td class="spacer"></td>
    <td class="label">Date:</td>
    <td class="field-line">{{ now()->format('F d, Y') }}</td>
  </tr>
  <tr>
    <td class="label">Client Name:</td>
    <td class="field-line">{{ $booking->client_name }}</td>
    <td class="spacer"></td>
    <td class="label">Agent:</td>
    <td class="field-line">{{ $booking->agent_code ?? '' }}</td>
  </tr>
  <tr>
    <td class="label">Contact No.:</td>
    <td class="field-line">{{ $booking->contact_number ?? '' }}</td>
    <td class="spacer"></td>
    <td class="label">No. of Pax:</td>
    <td class="field-line">{{ $booking->pax_count ?? '' }}</td>
  </tr>
  <tr>
    <td class="label">Destination:</td>
    <td class="field-line">{{ $booking->destination ?? '' }}</td>
    <td class="spacer"></td>
    <td class="label">Travel Date:</td>
    <td class="field-line">{{ $booking->travel_date ? $booking->travel_date->format('F d, Y') : '' }}</td>
  </tr>
  <tr>
    <td class="label">Airline:</td>
    <td class="field-line">{{ $booking->airline ?? '' }}</td>
    <td class="spacer"></td>
    <td class="label">Return Date:</td>
    <td class="field-line">{{ $booking->return_date ? $booking->return_date->format('F d, Y') : '' }}</td>
  </tr>
  <tr>
    <td class="label">Service Type:</td>
    <td class="field-line">{{ $booking->service_type ?? '' }}</td>
    <td class="spacer"></td>
    <td class="label">Transaction Type:</td>
    <td class="field-line">{{ $booking->transaction_type ?? '' }}</td>
  </tr>
</table>

{{-- ── SERVICES / PRICING TABLE ─────────────────────────────────────────── --}}
<div class="section-label">SERVICES &amp; PRICING</div>
<table class="services-table">
  <thead>
    <tr>
      <th>DESCRIPTION OF SERVICES</th>
      <th class="qty-col">QTY</th>
      <th class="unit-col">UNIT PRICE</th>
      <th class="total-col">TOTAL</th>
    </tr>
  </thead>
  <tbody>
    {{-- Main service row --}}
    <tr>
      <td>{{ $booking->particulars ?? ($booking->destination.' — Air Ticket') }}</td>
      <td class="qty-col">{{ $booking->pax_count ?? 1 }}</td>
      <td class="unit-col">
        @if ($booking->selling_price)
          &#8369; {{ number_format($booking->selling_price / max(1, $booking->pax_count ?? 1), 2) }}
        @endif
      </td>
      <td class="total-col">
        @if ($booking->selling_price)&#8369; {{ number_format($booking->selling_price, 2) }}@endif
      </td>
    </tr>

    {{-- Inclusions (if any) --}}
    @if ($booking->inclusions)
      @foreach (explode("\n", $booking->inclusions) as $inclusion)
        @if (trim($inclusion))
        <tr>
          <td>&nbsp;&nbsp;✓ {{ trim($inclusion) }}</td>
          <td class="qty-col"></td>
          <td class="unit-col"></td>
          <td class="total-col"></td>
        </tr>
        @endif
      @endforeach
    @endif

    {{-- Insurance row (if applicable) --}}
    @if ($booking->insurance_nett)
    <tr>
      <td>Travel Insurance</td>
      <td class="qty-col">{{ $booking->pax_count ?? 1 }}</td>
      <td class="unit-col">&#8369; {{ number_format($booking->insurance_nett, 2) }}</td>
      <td class="total-col">&#8369; {{ number_format($booking->insurance_nett, 2) }}</td>
    </tr>
    @endif

    {{-- 8 blank rows to fill the space --}}
    @for ($i = 0; $i < 8; $i++)
    <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
    @endfor

    {{-- Total row --}}
    <tr class="total-row">
      <td colspan="3" style="text-align:right; padding-right:12px;">TOTAL SELLING PRICE:</td>
      <td class="total-col">&#8369; {{ number_format($booking->selling_price ?? 0, 2) }}</td>
    </tr>
  </tbody>
</table>

{{-- ── EXCLUSIONS ──────────────────────────────────────────────────────── --}}
@if ($booking->exclusions)
<div class="terms-box" style="margin-bottom:8px;">
  <div class="terms-title">NOT INCLUDED / EXCLUSIONS:</div>
  {!! nl2br(e($booking->exclusions)) !!}
</div>
@endif

{{-- ── TERMS & CONDITIONS ───────────────────────────────────────────────── --}}
<div class="terms-box">
  <div class="terms-title">TERMS &amp; CONDITIONS:</div>
  1. This quotation is valid for <strong>3 days</strong> from the date of issuance. Prices are subject to change without prior notice after the validity period.<br>
  2. A <strong>50% deposit</strong> is required to confirm the booking. Full payment must be settled <strong>7 days before departure</strong>.<br>
  3. Ticket prices are subject to airline availability and may change without prior notice.<br>
  4. Cancellation and rebooking are subject to airline and supplier penalties.<br>
  5. Amkor Travel &amp; Tours Inc. is not liable for flight cancellations, delays, or changes made by the airline.
</div>

{{-- ── VALIDITY NOTE ────────────────────────────────────────────────────── --}}
<div class="validity-note">
  &#9888; This quotation is valid for 3 days from {{ now()->format('F d, Y') }}.
  Prices are subject to change based on availability.
</div>

{{-- ── BANK DETAILS ─────────────────────────────────────────────────────── --}}
<div class="bank-section">
  <div class="bank-title">TO CONFIRM BOOKING, DEPOSIT TO ANY OF THE FOLLOWING ACCOUNTS:</div>
  <div class="bank-cols">
    <div class="bank-col">
      <strong>BDO BANK DEPOSIT:</strong><br>
      ACCOUNT NAME: AMKOR TRAVEL AND TOURS INC<br>
      USD: 1002-7006-7671 &nbsp;|&nbsp; PHP: 0002-7006-7663<br>
      BANK NAME: BDO UNIBANK, INC. &nbsp;|&nbsp; SWIFT: BNORPHMM
    </div>
    <div class="bank-col">
      <strong>BPI BANK DEPOSIT:</strong><br>
      ACCOUNT NAME: AMKOR TRAVEL AND TOURS INC<br>
      USD: 0434 – 028 – 396 &nbsp;|&nbsp; PHP: 0433 – 203 – 194
    </div>
  </div>
</div>

{{-- ── SIGNATURE BLOCK ──────────────────────────────────────────────────── --}}
<table class="sig-table">
  <tr>
    <td style="width:50%;">
      <span class="sig-line">&nbsp;</span>
      Prepared by: {{ $preparedBy }}
    </td>
    <td style="width:50%;">
      <span class="sig-line">&nbsp;</span>
      Conforme (Client Signature over Printed Name):
    </td>
  </tr>
  <tr>
    <td style="padding-top:10px; font-size:8pt; color:#555;">
      {{ now()->format('F d, Y') }}
    </td>
    <td style="padding-top:10px; font-size:8pt; color:#555;">
      Date:
      <span style="display:inline-block; width:120px; border-bottom:1px solid #000;">&nbsp;</span>
    </td>
  </tr>
</table>

</body>
</html>
