<?php

namespace Modules\Visa\Events;

class VisaOrReceived
{
    public function __construct(
        public readonly int $visaId,
        public readonly string $orNumber,
        public readonly ?int $branchId,
        public readonly ?int $actorId,
    ) {}
}
