import SegmentedControl from './SegmentedControl';

/**
 * SessionPicker — Full Day / First Half / Second Half segmented control.
 *
 * Only rendered when the leave duration is exactly 1 day. The parent
 * should conditionally mount this component based on the date range.
 *
 * Props:
 *   value    : 'full_day' | 'first_half' | 'second_half'
 *   onChange : (value: string) => void
 */
export default function SessionPicker({ value, onChange }) {
    const tabs = [
        { key: 'full_day',    label: 'Full Day'    },
        { key: 'first_half',  label: 'First Half'  },
        { key: 'second_half', label: 'Second Half' },
    ];

    return (
        <SegmentedControl
            tabs={tabs}
            activeKey={value ?? 'full_day'}
            onChange={onChange}
        />
    );
}
