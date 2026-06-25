import Badge from '../UI/Badge';

/**
 * StatusBadge — maps common status strings to Badge variants.
 *
 * Color logic:
 *   primary/success → brand green  (completed, confirmed, approved, paid, active, released)
 *   warning         → amber        (pending, quoted, partial, checked, on_process)
 *   error           → red          (cancelled, denied, forfeited, unpaid, overdue)
 *   info            → blue         (inquiry, sent, prepared)
 *   neutral         → muted gray   (refunded, draft, inactive)
 *
 * Props:
 *   status   : string
 *   className: string
 */

const STATUS_MAP = {
    // Booking / Reservation
    inquiry   : { variant: 'info',    label: 'Inquiry'    },
    quoted    : { variant: 'warning', label: 'Quoted'     },
    confirmed : { variant: 'primary', label: 'Confirmed'  },
    cancelled : { variant: 'error',   label: 'Cancelled'  },

    // Visa applications
    pending    : { variant: 'warning', label: 'Pending'    },
    on_process : { variant: 'warning', label: 'On Process' },
    completed  : { variant: 'primary', label: 'Completed'  },
    approved   : { variant: 'primary', label: 'Approved'   },
    denied     : { variant: 'error',   label: 'Denied'     },
    forfeited  : { variant: 'error',   label: 'Forfeited'  },
    refunded   : { variant: 'neutral', label: 'Refunded'   },

    // Payments / Payables
    unpaid    : { variant: 'error',   label: 'Unpaid'    },
    paid      : { variant: 'primary', label: 'Paid'      },
    partial   : { variant: 'warning', label: 'Partial'   },
    overdue   : { variant: 'error',   label: 'Overdue'   },
    draft     : { variant: 'neutral', label: 'Draft'     },
    sent      : { variant: 'info',    label: 'Sent'      },

    // Approval chain
    prepared       : { variant: 'info',    label: 'Prepared'  },
    checked        : { variant: 'warning', label: 'Checked'   },
    final_approved : { variant: 'primary', label: 'Approved'  },
    released       : { variant: 'primary', label: 'Released'  },

    // Generic
    active   : { variant: 'primary', label: 'Active'    },
    inactive : { variant: 'neutral', label: 'Inactive'  },
};

export default function StatusBadge({ status = '', className = '' }) {
    const config = STATUS_MAP[status?.toLowerCase()] ?? {
        variant: 'neutral',
        label  : status ?? '—',
    };

    return (
        <Badge variant={config.variant} className={className}>
            {config.label}
        </Badge>
    );
}
