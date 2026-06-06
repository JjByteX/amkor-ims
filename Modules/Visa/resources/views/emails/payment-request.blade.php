<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Visa Payment Request</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 15px; color: #0F172A; background: #F9FAFB; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #3F9800; padding: 24px 32px; }
        .header h1 { margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; }
        .header p  { margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
        .body { padding: 32px; }
        .body p { margin: 0 0 16px; line-height: 1.6; }
        .detail-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .detail-table td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #F1F5F9; }
        .detail-table td:first-child { color: #64748B; width: 45%; }
        .detail-table td:last-child { font-weight: 600; color: #0F172A; }
        .amount-row td { background: #F0FDF4; color: #166534 !important; }
        .footer { padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>Amkor Travel &amp; Tours Inc.</h1>
            <p>Internal Management System — Visa Payment Request</p>
        </div>

        <div class="body">
            <p>Hi,</p>
            <p>
                A visa payment request has been submitted by <strong>{{ $requestedByName }}</strong>
                and requires your attention.
            </p>

            <table class="detail-table">
                <tr>
                    <td>Customer</td>
                    <td>{{ $customerName }}</td>
                </tr>
                <tr>
                    <td>Visa / Service Type</td>
                    <td>{{ $visaType }}</td>
                </tr>
                <tr>
                    <td>Payment Due Date</td>
                    <td>{{ $dueDate ?? 'Not specified' }}</td>
                </tr>
                <tr class="amount-row">
                    <td>Amount (Net Payable)</td>
                    <td>₱{{ $amount }}</td>
                </tr>
            </table>

            <p>
                Please prepare the cash or check voucher and have it ready for release
                before end of day on the due date.
            </p>

            <p>
                Log in to the Amkor IMS to view the full application details and mark
                the voucher as released once processed.
            </p>
        </div>

        <div class="footer">
            This is an automated notification from the Amkor Travel &amp; Tours Internal Management System.
            Do not reply to this email.
        </div>
    </div>
</body>
</html>
