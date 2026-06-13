<?php

namespace Modules\OrmocBranch\Events;

class OrmocBookingForwardedToAccounting
{
    public function __construct(
        public readonly int $bookingId,
        public readonly string $clientName,
        public readonly ?string $agentCode,
        public readonly ?string $date,
        public readonly ?string $sellingPrice,
        public readonly ?string $poNumber,
        public readonly ?string $soaNumber,
        public readonly ?string $siNumber,
        public readonly ?string $arNumber,
        public readonly ?int $branchId,
        public readonly ?int $actorId,
    ) {}
}
