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
    Route::resource('contacts', ContactsController::class);
});
