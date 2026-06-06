import Badge from '../UI/Badge';

/**
 * StatusBadge — maps common status strings to Badge variants.
 *
 * Props:
 *   status   : string
 *   className: string
 *
 * Covers statuses from: bookings, visa applications, payments, AR, payables.
 */

const STATUS_MAP = {
    // Booking / Reservation
    inquiry   : { variant: 'info',    label: 'Inquiry'    },
    quoted    : { variant: 'warning', label: 'Quoted'     },
    confirmed : { variant: 'success', label: 'Confirmed'  },
    cancelled : { variant: 'error',   label: 'Cancelled'  },

    // Visa applications
    pending    : { variant: 'warning', label: 'Pending'    },
    on_process : { variant: 'info',    label: 'On Process' },
    completed  : { variant: 'success', label: 'Completed'  },
    approved   : { variant: 'success', label: 'Approved'   },
    denied     : { variant: 'error',   label: 'Denied'     },
    forfeited  : { variant: 'error',   label: 'Forfeited'  },
    refunded   : { variant: 'neutral', label: 'Refunded'   },

    // Payments / Payables
    unpaid    : { variant: 'error',   label: 'Unpaid'    },
    paid      : { variant: 'success', label: 'Paid'      },
    partial   : { variant: 'warning', label: 'Partial'   },
    overdue   : { variant: 'error',   label: 'Overdue'   },
    draft     : { variant: 'neutral', label: 'Draft'     },
    sent      : { variant: 'info',    label: 'Sent'      },

    // Approval chain
    prepared : { variant: 'info',    label: 'Prepared'  },
    checked  : { variant: 'warning', label: 'Checked'   },
    final_approved : { variant: 'success', label: 'Approved' },
    released : { variant: 'success', label: 'Released'  },

    // Generic
    active   : { variant: 'success', label: 'Active'    },
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
