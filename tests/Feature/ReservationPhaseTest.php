<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Reservation\Models\ReservationBooking;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReservationPhaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_resa_user_can_create_and_forward_confirmed_booking(): void
    {
        $user = $this->userWithRole('resa_officer');

        $response = $this->actingAs($user)->post(route('reservation.store'), [
            'date' => '2026-06-07',
            'agent_code' => 'JHONA',
            'client_name' => 'Maria Santos',
            'destination' => 'Tokyo',
            'travel_date' => '2026-08-10',
            'return_date' => '2026-08-17',
            'pax_count' => 2,
            'service_type' => 'package',
            'selling_price' => 120000,
            'net_payable' => 90000,
            'mode_of_payment' => 'bank_transfer',
            'status' => 'confirmed',
        ]);

        $booking = ReservationBooking::first();

        $response->assertRedirect(route('reservation.show', $booking));
        $this->assertSame('confirmed', $booking->status);
        $this->assertSame('30000.00', $booking->income);
        $this->assertNotNull($booking->confirmed_at);

        $this->actingAs($user)
            ->post(route('reservation.forward-accounting', $booking))
            ->assertRedirect();

        $this->assertTrue($booking->fresh()->forwarded_to_accounting);
    }

    public function test_ormoc_user_cannot_view_another_branch_reservation(): void
    {
        $qc = Branch::create(['name' => 'QC Main', 'code' => 'QC']);
        $ormoc = Branch::create(['name' => 'Ormoc Branch', 'code' => 'ORM']);
        $user = $this->userWithRole('ormoc_branch_officer', $ormoc);

        $booking = ReservationBooking::create([
            'booking_no' => 'RESA-202606-0001',
            'date' => '2026-06-07',
            'client_name' => 'QC Client',
            'pax_count' => 1,
            'service_type' => 'package',
            'status' => 'inquiry',
            'branch_id' => $qc->id,
        ]);

        $this->actingAs($user)
            ->get(route('reservation.show', $booking))
            ->assertForbidden();
    }

    private function userWithRole(string $roleName, ?Branch $branch = null): User
    {
        $branch ??= Branch::create(['name' => 'QC Main', 'code' => 'QC']);
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        $user = User::factory()->create(['branch_id' => $branch->id]);
        $user->assignRole($role);

        return $user;
    }
}
