<?php

namespace Modules\Attendance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Attendance\Models\AttendanceRecord;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Role check handled in controller
    }

    public function rules(): array
    {
        $recordId = $this->route('attendance')?->id;

        return [
            'employee_id'     => ['required', 'integer', 'exists:users,id'],
            'user_id'         => ['nullable', 'integer', 'exists:users,id'],
            'work_date'       => [
                'required',
                'date',
                // Unique per employee per day — ignore current record on update
                'unique:attendance_records,work_date,'.($recordId ?? 'NULL').',id,employee_id,'.$this->input('employee_id').',deleted_at,NULL',
            ],
            'time_in'         => ['nullable', 'date_format:H:i'],
            'time_out'        => ['nullable', 'date_format:H:i', 'after:time_in'],
            'break_start'     => ['nullable', 'date_format:H:i'],
            'break_end'       => ['nullable', 'date_format:H:i', 'after:break_start'],
            'minutes_overtime'  => ['nullable', 'integer', 'min:0'],
            'minutes_overbreak' => ['nullable', 'integer', 'min:0'],
            'status'          => ['required', 'string', 'in:'.implode(',', array_keys(AttendanceRecord::STATUSES))],
            'leave_type'      => ['nullable', 'string', 'in:'.implode(',', array_keys(AttendanceRecord::LEAVE_TYPES))],
            'branch_id'       => ['nullable', 'integer', 'exists:branches,id'],
            'override_reason' => ['nullable', 'string', 'max:500'],
            'remarks'         => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'work_date.unique'    => 'An attendance record for this employee on that date already exists.',
            'time_out.after'      => 'Time out must be after time in.',
            'break_end.after'     => 'Break end must be after break start.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Trim seconds from time inputs (form sends HH:MM, DB stores HH:MM:SS)
        foreach (['time_in', 'time_out', 'break_start', 'break_end'] as $field) {
            if ($this->$field) {
                $this->merge([$field => substr($this->$field, 0, 5)]);
            }
        }
    }
}
