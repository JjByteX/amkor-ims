<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Statement of Account {{ $transaction->document_number }}</title>
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
  .header-bar .company-name .airplane {
    font-size: 16pt;
  }
  .header-bar .logos {
    float: right;
    font-size: 7pt;
    text-align: right;
    margin-top: 2px;
    opacity: 0.9;
  }

  /* ── Branch info strip ──────────────────────────────────────────── */
  .branch-strip {
    border-top: 3px solid #7DC24B;
    border-bottom: 3px solid #7DC24B;
    display: table;
    width: 100%;
    margin-bottom: 14px;
  }
  .branch-col {
    display: table-cell;
    width: 33.33%;
    padding: 6px 10px;
    border-right: 1px solid #ccc;
    vertical-align: top;
    font-size: 7.5pt;
    text-align: center;
  }
  .branch-col:last-child { border-right: none; }
  .branch-col .branch-name {
    font-weight: bold;
    color: #2D6A00;
    font-size: 8pt;
    text-decoration: underline;
    margin-bottom: 2px;
  }

  /* ── Doc title ──────────────────────────────────────────────────── */
  .doc-title {
    text-align: center;
    font-size: 16pt;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 14px;
  }

  /* ── To block ───────────────────────────────────────────────────── */
  .to-grid {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .to-grid td { padding: 2px 4px; font-size: 9pt; vertical-align: bottom; }
  .to-grid .field-label { width: 80px; font-weight: normal; }
  .to-grid .field-line {
    border-bottom: 1px solid #000;
    width: 220px;
    min-width: 180px;
  }
  .to-grid .right-label { text-align: right; padding-right: 8px; }
  .to-grid .no-value { font-weight: bold; }

  /* ── Items table ────────────────────────────────────────────────── */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  .items-table th {
    border: 1px solid #000;
    padding: 5px 8px;
    font-size: 9pt;
    text-align: center;
    font-weight: bold;
    background: #fff;
  }
  .items-table td {
    border: 1px solid #000;
    padding: 5px 8px;
    font-size: 9pt;
    vertical-align: top;
  }
  .items-table .amount-col { width: 110px; text-align: right; }
  .items-table .total-col  { width: 110px; text-align: right; }
  .items-table .date-col   { width: 80px; }
  .items-table .empty-row td { height: 20px; }

  /* ── Footer row ─────────────────────────────────────────────────── */
  .footer-table {
    width: 100%;
    border-collapse: collapse;
  }
  .footer-table td { border: 1px solid #000; padding: 4px 8px; font-size: 9pt; }
  .footer-table .words-cell { font-style: italic; }
  .footer-table .acr-cell   { text-align: right; font-weight: bold; }

  /* ── Interest clause ────────────────────────────────────────────── */
  .interest-clause {
    margin-top: 8px;
    font-size: 8pt;
    line-height: 1.5;
    border: 1px solid #ccc;
    padding: 6px 10px;
  }
  .interest-clause .big-f {
    font-size: 12pt;
    font-weight: bold;
    float: left;
    margin-right: 2px;
    line-height: 1;
    color: #CC0000;
  }

  /* ── Bank details ───────────────────────────────────────────────── */
  .bank-section {
    margin-top: 8px;
    font-size: 7.5pt;
  }
  .bank-section .bank-title {
    font-weight: bold;
    font-size: 8pt;
    margin-bottom: 4px;
  }
  .bank-cols { display: table; width: 100%; }
  .bank-col  { display: table-cell; width: 50%; vertical-align: top; padding-right: 16px; }

  /* ── Signature block ─────────────────────────────────────────────── */
  .sig-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }
  .sig-table td { padding: 2px 10px; font-size: 9pt; }
  .sig-line { border-bottom: 1px solid #000; display: block; margin-bottom: 3px; min-height: 22px; }
</style>
</head>
<body>

{{-- ── HEADER BAR ─────────────────────────────────────────────────────── --}}
<div class="header-bar">
  <span class="logos" style="float:right; font-size:7pt; opacity:0.85;">IATA &nbsp;·&nbsp; PTAA</span>
  <div class="company-name">&#9992; AMKOR TRAVEL &amp; TOURS INC.</div>
</div>

{{-- ── BRANCH STRIP ────────────────────────────────────────────────────── --}}
<div style="border-top: 3px solid #7DC24B; border-bottom: 3px solid #7DC24B; margin-bottom: 14px;">
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
<div class="doc-title">STATEMENT OF ACCOUNT</div>

{{-- ── TO / DATE BLOCK ─────────────────────────────────────────────────── --}}
<table class="to-grid">
  <tr>
    <td class="field-label">TO:</td>
    <td class="field-line">{{ $transaction->client_name }}</td>
    <td style="width:30px;"></td>
    <td style="white-space:nowrap; padding-right:6px;">No.:</td>
    <td style="font-weight:bold;">{{ $transaction->document_number }}</td>
  </tr>
  <tr>
    <td class="field-label">ADDRESS:</td>
    <td class="field-line">{{ $transaction->address ?? '' }}</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td class="field-label">TEL NO.:</td>
    <td class="field-line"></td>
    <td></td>
    <td style="white-space:nowrap; padding-right:6px;">DUE DATE:</td>
    <td class="field-line">{{ $transaction->due_date ? $transaction->due_date->format('F d, Y') : '' }}</td>
  </tr>
  <tr>
    <td class="field-label">DATE:</td>
    <td class="field-line">{{ $transaction->transaction_date->format('F d, Y') }}</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>

{{-- ── ITEMS TABLE ─────────────────────────────────────────────────────── --}}
<table class="items-table">
  <thead>
    <tr>
      <th class="date-col">DATE</th>
      <th>PARTICULARS</th>
      <th class="amount-col">AMOUNT</th>
      <th class="total-col">TOTAL AMOUNT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{ $transaction->transaction_date->format('m/d/Y') }}</td>
      <td>{{ $transaction->particulars ?? 'Travel Services Rendered' }}</td>
      <td class="amount-col">&#8369; {{ number_format($transaction->gross_amount, 2) }}</td>
      <td class="total-col">&#8369; {{ number_format($transaction->gross_amount, 2) }}</td>
    </tr>
    {{-- Empty rows for manual additions on printed copy --}}
    @for ($i = 0; $i < 10; $i++)
    <tr class="empty-row"><td></td><td></td><td></td><td></td></tr>
    @endfor
  </tbody>
</table>

{{-- ── FOOTER ROW: Amount in words + ACR ─────────────────────────────── --}}
<table class="footer-table">
  <tr>
    <td class="words-cell" style="width:75%;">
      <em>Amount in words: {{ $amountInWords }}</em>
    </td>
    <td class="acr-cell">
      ACR: {{ $transaction->tin ?? '' }}
    </td>
  </tr>
</table>

{{-- ── INTEREST CLAUSE ──────────────────────────────────────────────────── --}}
<div class="interest-clause">
  <span class="big-f">F</span>ailure to pay statement of Account within 15 days from the date hereof shall be subjected the amount to interest to the rate of 36% per annum in the event litigation on the obligor shall be subject to attorney's fee equal to 15% of the amount due plus cost of litigation.
</div>

{{-- ── BANK DETAILS ─────────────────────────────────────────────────────── --}}
<div class="bank-section">
  <div class="bank-title">FOR SETTLEMENTS, YOU MAY DEPOSIT AMOUNT THRU ANY OF THE FF. BANK DETAILS:</div>
  <div class="bank-cols">
    <div class="bank-col">
      <strong>BDO BANK DEPOSIT:</strong><br>
      ACCOUNT NAME: AMKOR TRAVEL AND TOURS INC<br>
      USD: 1002-7006-7671<br>
      PHP: 0002-7006-7663<br>
      BANK NAME: BDO UNIBANK, INC.<br>
      SWIFT CODE: BNORPHMM<br>
      BANK ADDRESS: Lot 3-B, Quezon Ave. Extension, Quezon City
    </div>
    <div class="bank-col">
      <strong>BPI BANK DEPOSIT:</strong><br>
      ACCOUNT NAME: AMKOR TRAVEL AND TOURS INC<br>
      USD: 0434 – 028 – 396<br>
      PHP: 0433 – 203 – 194
    </div>
  </div>
</div>

{{-- ── SIGNATURE BLOCK ──────────────────────────────────────────────────── --}}
<table class="sig-table">
  <tr>
    <td style="width:50%;">
      <span class="sig-line">&nbsp;</span>
      Checked by:
    </td>
    <td style="width:50%;">
      <span class="sig-line">&nbsp;</span>
      Received by:
    </td>
  </tr>
  <tr>
    <td style="padding-top:10px;">
      <span class="sig-line">&nbsp;</span>
      Approved by:
    </td>
    <td style="padding-top:10px;">
      <span class="sig-line">&nbsp;</span>
      Date Received:
    </td>
  </tr>
</table>

</body>
</html>
