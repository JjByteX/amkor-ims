import { router, usePage } from '@inertiajs/react';
import {
    User, Briefcase, ShieldCheck, CalendarDays, CalendarClock, Shirt,
} from 'lucide-react';
import SegmentedControl from '../UI/SegmentedControl';

/**
 * PROFILE_TABS — single source of truth for the employee profile tab set.
 *
 * Import this array anywhere that needs to know which tabs exist
 * (e.g. EmployeeShow.jsx for conditional content rendering).
 *
 * key       : matches the ?tab= URL param value
 * label     : display label in the segmented control
 * icon      : lucide component reference (SegmentedControl renders at 14px)
 */
export const PROFILE_TABS = [
    { key: 'personal',    label: 'Personal',       icon: User          },
    { key: 'employment',  label: 'Employment',      icon: Briefcase     },
    { key: 'gov_ids',     label: 'Government IDs',  icon: ShieldCheck   },
    { key: 'leaves',      label: 'Leaves',          icon: CalendarDays  },
    { key: 'attendance',  label: 'Attendance',      icon: CalendarClock },
    { key: 'gear',        label: 'Gear',            icon: Shirt         },
];

export const DEFAULT_TAB = 'personal';

/**
 * ProfileTabBar
 *
 * Renders a SegmentedControl for the employee full-page profile.
 * Tab state lives in the ?tab= URL param so tabs are deep-linkable and
 * survive refresh.  Uses router.get with preserveState + replace so the
 * back-stack doesn't grow on every tab switch.
 *
 * Props:
 *   activeTab  : string  — currently active tab key (read from URL by parent)
 *   employeeId : number  — used to construct the correct route
 */
export default function ProfileTabBar({ activeTab, employeeId }) {
    const { url } = usePage();

    function handleChange(key) {
        // Build the new URL preserving any other params (e.g. panel)
        const base = route('employees.show', employeeId);
        router.get(base, { tab: key }, { preserveState: true, replace: true });
    }

    return (
        <div
            style={{
                borderBottom : 'var(--border-container)',
                paddingBottom : 'var(--space-2)',
                overflowX    : 'auto',
            }}
        >
            <SegmentedControl
                tabs={PROFILE_TABS}
                activeKey={activeTab ?? DEFAULT_TAB}
                onChange={handleChange}
            />
        </div>
    );
}