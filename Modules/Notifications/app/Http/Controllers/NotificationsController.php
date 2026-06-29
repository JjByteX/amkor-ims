<?php

namespace Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();

                $perPage = max(5, min(100, (int) $request->get('per_page', 30)));
$query = $request->user()
            ->notifications()
            ->when($status === 'unread', fn ($q) => $q->whereNull('read_at'))
            ->when($status === 'archived', fn ($q) => $q->whereNotNull('archived_at'))
            ->when($status !== 'archived', fn ($q) => $q->whereNull('archived_at'))
            ->latest();

        return Inertia::render('Notifications/Index', [
            'notifications' => $query->paginate($perPage)->withQueryString(),
            'filters' => ['status' => $status, 'per_page' => $perPage],
            'unreadCount' => $request->user()->unreadNotifications()->whereNull('archived_at')->count(),
        ]);
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $item = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $item->markAsRead();

        return back()->with('flash', ['type' => 'success', 'message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->whereNull('archived_at')->update(['read_at' => now()]);

        return back()->with('flash', ['type' => 'success', 'message' => 'All notifications marked as read.']);
    }

    public function archive(Request $request, string $notification): RedirectResponse
    {
        $request->user()
            ->notifications()
            ->whereKey($notification)
            ->update(['archived_at' => now(), 'read_at' => now()]);

        return back()->with('flash', ['type' => 'success', 'message' => 'Notification archived.']);
    }

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $request->user()->notifications()->whereKey($notification)->delete();

        return back()->with('flash', ['type' => 'success', 'message' => 'Notification deleted.']);
    }
}
