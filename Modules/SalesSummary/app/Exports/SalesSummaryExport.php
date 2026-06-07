<?php

namespace Modules\SalesSummary\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SalesSummaryExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows->map(fn ($row) => [
            'department' => $row->department_label,
            'date' => $row->date,
            'reference' => $row->reference,
            'customer' => $row->customer,
            'branch' => $row->branch_name,
            'agent_code' => $row->agent_code,
            'gross_sales' => (float) $row->gross_sales,
            'net_payable' => (float) $row->net_payable,
            'income' => (float) $row->income,
            'status' => $row->collection_status,
        ]);
    }

    public function headings(): array
    {
        return [
            'Department',
            'Date',
            'Reference',
            'Customer',
            'Branch',
            'Agent Code',
            'Gross Sales',
            'Net Payable',
            'Income',
            'Status',
        ];
    }
}
