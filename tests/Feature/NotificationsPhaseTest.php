<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Notifications\Notifications\WorkflowNotification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationsPhaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_and_mark_notifications_read(): void
    {
        $user = $this->userWithRole('general_manager');

        $user->notify(new WorkflowNotification(
            'Reservation confirmed',
            'RESA-202606-0001 has been confirmed.',
            '/reservation/1',
            'success',
        ));

        $notification = $user->notifications()->first();

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Notifications/Index')
                ->where('unreadCount', 1)
                ->has('notifications.data', 1)
            );

        $this->actingAs($user)
            ->post(route('notifications.read', $notification->id))
            ->assertRedirect();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_user_can_mark_all_notifications_read_and_archive_one(): void
    {
        $user = $this->userWithRole('general_manager');
        $user->notify(new WorkflowNotification('One', 'First message.'));
        $user->notify(new WorkflowNotification('Two', 'Second message.'));

        $this->actingAs($user)
            ->post(route('notifications.read-all'))
            ->assertRedirect();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());

        $notification = $user->notifications()->first();

        $this->actingAs($user)
            ->post(route('notifications.archive', $notification->id))
            ->assertRedirect();

        $this->assertNotNull($notification->fresh()->archived_at);
    }

    private function userWithRole(string $roleName): User
    {
        $branch = Branch::create(['name' => 'QC Main', 'code' => 'QC']);
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        $user = User::factory()->create(['branch_id' => $branch->id]);
        $user->assignRole($role);

        return $user;
    }
}
