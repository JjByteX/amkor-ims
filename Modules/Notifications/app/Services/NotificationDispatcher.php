<?php

namespace Modules\Notifications\Services;

use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Modules\Notifications\Notifications\ExternalNoticeNotification;
use Modules\Notifications\Notifications\WorkflowNotification;
use Spatie\Permission\Models\Role;

class NotificationDispatcher
{
    public function notifyRoles(array $roles, string $title, string $message, ?string $url = null, string $level = 'info', bool $sendMail = false): void
    {
        $existingRoles = Role::query()
            ->whereIn('name', $roles)
            ->pluck('name')
            ->all();

        if ($existingRoles === []) {
            return;
        }

        $users = User::role($existingRoles)->active()->get();

        if ($users->isEmpty()) {
            return;
        }

        Notification::send($users, new WorkflowNotification($title, $message, $url, $level, $sendMail));
    }

    public function email(string $email, string $subject, string $greeting, array $lines): void
    {
        Notification::route('mail', $email)
            ->notify(new ExternalNoticeNotification($subject, $greeting, $lines));
    }
}
