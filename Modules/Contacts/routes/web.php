<?php

use Illuminate\Support\Facades\Route;
use Modules\Contacts\Http\Controllers\ContactsController;

/*
|--------------------------------------------------------------------------
| Contacts Module Routes
|--------------------------------------------------------------------------
| All authenticated roles can VIEW contacts.
| Write access (create / edit / delete) is enforced in the controller —
| only: general_manager, accounting_officer, disbursement_officer, admin_auditor.
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    // Typeahead search used by the contact_id picker on booking/visa forms.
    // Must be registered before the resource route so it isn't swallowed by
    // the {contact} show binding.
    Route::get('contacts/search', [ContactsController::class, 'search'])
        ->name('contacts.search');

    Route::resource('contacts', ContactsController::class);
});
