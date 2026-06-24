<?php

namespace Modules\Notifications\Listeners;

use Modules\Notifications\Services\NotificationDispatcher;
use Modules\Reservation\Events\ReservationForwardedToAccounting;
use Modules\Reservation\Models\ReservationBooking;

/**
 * SendBookingForwardedToAccountingNotification
 *
 * Handles ReservationForwardedToAccounting for ALL branches (QC and Ormoc).
 * Replaces both SendReservationForwardedToAccountingNotification and
 * SendOrmocBookingForwardedToAccountingNotification.
 *
 * The notification message includes the branch name so accounting officers
 * can immediately see whether it's a QC or Ormoc booking.
 * The link always points to /reservation/{id} — the unified page.
 */
class SendBookingForwardedToAccountingNotification
{
    public function handle(ReservationForwardedToAccounting $event): void
    {
        // Fetch branch name to make the notification message meaningful
        $booking    = ReservationBooking::with('branch')->find($event->bookingId);
        $branchName = $booking?->branch?->name ?? 'Branch';

        app(NotificationDispatcher::class)->notifyRoles(
            ['accounting_officer', 'general_manager', 'admin_auditor'],
            "{$branchName} booking forwarded to accounting",
            "{$event->bookingNo} for {$event->clientName} ({$branchName}) is ready for accounting review.",
            "/reservation/{$event->bookingId}",
            'info',
            true,
        );
    }
}
