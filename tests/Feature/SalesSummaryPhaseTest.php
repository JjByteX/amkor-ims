<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Reservation\Models\ReservationBooking;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SalesSummaryPhaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_summary_aggregates_reservation_sales_and_targets(): void
    {
        $branch = Branch::create(['name' => 'QC Main', 'code' => 'QC']);
        $user = $this->userWithRole('general_manager', $branch, ['sales.view_consolidated', 'sales.set_monthly_target']);

        ReservationBooking::create([
            'booking_no' => 'RESA-202606-0001',
            'date' => '2026-06-07',
            'client_name' => 'Maria Santos',
            'agent_code' => 'JHONA',
            'pax_count' => 2,
            'service_type' => 'package',
            'selling_price' => 120000,
            'net_payable' => 90000,
            'income' => 30000,
            'status' => 'confirmed',
            'branch_id' => $branch->id,
        ]);

        $this->actingAs($user)->post(route('sales.targets.store'), [
            'department' => 'reservation',
            'branch_id' => $branch->id,
            'agent_code' => null,
            'year' => 2026,
            'month' => 6,
            'target_amount' => 150000,
        ])->assertRedirect();

        $this->actingAs($user)
            ->get(route('sales.index', ['year' => 2026, 'month' => 6]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SalesSummary/Index')
                ->where('totals.gross_sales', 120000)
                ->where('totals.income', 30000)
                ->has('targets', 1)
            );
    }

    private function userWithRole(string $roleName, Branch $branch, array $permissions = []): User
    {
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $role->givePermissionTo($permissions);

        $user = User::factory()->create(['branch_id' => $branch->id]);
        $user->assignRole($role);

        return $user;
    }
}
