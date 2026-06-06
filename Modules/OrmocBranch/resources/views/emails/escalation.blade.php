<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>International Booking Escalation</title>
    <style>
        body { font-family: Inter, Arial, sans-serif; font-size: 15px; color: #0F172A; background: #F9FAFB; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .header { background: #3F9800; padding: 24px 32px; }
        .header h1 { color: #ffffff; font-family: Manrope, Arial, sans-serif; font-size: 18px; font-weight: 600; margin: 0; }
        .header p  { color: rgba(255,255,255,0.85); font-size: 13px; margin: 4px 0 0; }
        .body { padding: 28px 32px; }
        .body p { margin: 0 0 16px; line-height: 1.6; }
        .booking-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .booking-table th { text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748B; padding: 6px 10px 6px 0; border-bottom: 1px solid #E2E8F0; }
        .booking-table td { font-size: 14px; color: #0F172A; padding: 10px 10px 10px 0; border-bottom: 1px solid #F1F5F9; vertical-align: top; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .badge-international { background: #EFF6FF; color: #1D4ED8; }
        .flag { display: inline-block; padding: 2px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: #FEF3C7; color: #92400E; }
        .action-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .action-box p { margin: 0 0 8px; color: #14532D; font-weight: 600; font-size: 14px; }
        .action-box ul { margin: 0; padding-left: 18px; color: #166534; font-size: 14px; line-height: 1.8; }
        .footer { background: #F8FAFC; padding: 18px 32px; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
    </style>
</head>
<body>
<div class="wrapper">

    <div class="header">
        <h1>Amkor Travel &amp; Tours Inc.</h1>
        <p>Internal Management System — International Booking Escalation</p>
    </div>

    <div class="body">

        <p>Hi,</p>

        <p>
            An international booking from the <strong>Ormoc Branch</strong> has been escalated to
            QC Head Office for issuance. This booking was escalated by
            <strong>{{ $escalatedByName }}</strong>.
        </p>

        <table class="booking-table">
            <tr>
                <th>Field</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>Client</td>
                <td><strong>{{ $booking->client_name }}</strong></td>
            </tr>
            <tr>
                <td>Booking Type</td>
                <td><span class="badge badge-international">International</span></td>
            </tr>
            <tr>
                <td>Agent Code</td>
                <td>{{ $booking->agent_code }}</td>
            </tr>
            <tr>
                <td>Destination</td>
                <td>{{ $booking->destination ?? '—' }}</td>
            </tr>
            <tr>
                <td>Travel Date</td>
                <td>
                    @if ($booking->travel_date)
                        {{ $booking->travel_date->format('F j, Y') }}
                    @else
                        —
                    @endif
                </td>
            </tr>
            <tr>
                <td>Pax Count</td>
                <td>{{ $booking->pax_count ?? '—' }}</td>
            </tr>
            <tr>
                <td>Passport Expiry</td>
                <td>
                    @if ($booking->passport_expiry)
                        {{ $booking->passport_expiry->format('F j, Y') }}
                        @if ($booking->passport_expiry_flagged)
                            &nbsp;<span class="flag">⚠ Expiry within 6 months</span>
                        @endif
                    @else
                        —
                    @endif
                </td>
            </tr>
            <tr>
                <td>Selling Price</td>
                <td>
                    @if ($booking->selling_price)
                        PHP {{ number_format($booking->selling_price, 2) }}
                    @else
                        —
                    @endif
                </td>
            </tr>
            <tr>
                <td>Booking Date</td>
                <td>{{ $booking->date->format('F j, Y') }}</td>
            </tr>
            <tr>
                <td>Escalated At</td>
                <td>{{ $booking->escalated_at?->format('F j, Y g:i A') ?? now()->format('F j, Y g:i A') }}</td>
            </tr>
            @if ($booking->remarks)
            <tr>
                <td>Remarks</td>
                <td>{{ $booking->remarks }}</td>
            </tr>
            @endif
            @if ($booking->notes)
            <tr>
                <td>Notes</td>
                <td>{{ $booking->notes }}</td>
            </tr>
            @endif
        </table>

        <div class="action-box">
            <p>Action Required:</p>
            <ul>
                <li>Review this booking in the Amkor IMS system</li>
                <li>Coordinate with Ormoc Branch Officer on issuance</li>
                <li>If routing through Mariposa: ensure P.O. is sent and confirmed</li>
                <li>Update booking status once issuance is complete</li>
            </ul>
        </div>

        <p>
            Log in to the Amkor IMS to view full booking details, attach documents,
            and update the escalation status.
        </p>

        <p>
            This is an automated notification from the Amkor IMS.<br>
            Do not reply to this email.
        </p>

    </div>

    <div class="footer">
        Amkor Travel &amp; Tours Inc. &nbsp;|&nbsp;
        Suite 108 West City Plaza Bldg. #66, West Avenue, Quezon City &nbsp;|&nbsp;
        TIN: 223-586-994-00000
    </div>

</div>
</body>
</html>
