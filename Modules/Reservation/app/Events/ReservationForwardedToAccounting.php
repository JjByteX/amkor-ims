<?php

namespace Modules\Reservation\Events;

class ReservationForwardedToAccounting
{
    public function __construct(
        public readonly int $bookingId,
        public readonly string $bookingNo,
        public readonly string $clientName,
        public readonly ?int $branchId,
        public readonly ?int $actorId,
    ) {}
}
