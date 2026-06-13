<?php

namespace Modules\AccountsReceivable\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\AccountsReceivable\Models\Collectible;

class CollectibleFullyApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Collectible $collectible,
    ) {}
}
