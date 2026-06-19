<?php

use Illuminate\Support\Facades\Route;
use Modules\Contacts\Http\Controllers\ContactsController;

/*
|--------------------------------------------------------------------------
| Contacts Module Routes
|--------------------------------------------------------------------------
|
| View:         all authenticated roles
| Create:       sales_reservation_officer, sales_ticketing_officer,
|               group_sales_officer, general_sales_manager,
|               visa_documentation_officer, visa_documentation_supervisor,
|               branch_supervisor, branch_sales_officer,
|               business_development_manager,
|               accounting_assistant, finance_admin_supervisor,
|               administrative_assistant, president, chief_operating_officer
| Update (own): sales_reservation_officer, sales_ticketing_officer,
|               group_sales_officer, visa_documentation_officer,
|               branch_supervisor, branch_sales_officer
| Update (all): general_sales_manager, visa_documentation_supervisor,
|               business_development_manager, accounting_assistant,
|               finance_admin_supervisor, administrative_assistant,
|               president, chief_operating_officer
| Delete:       president only
|
| Write access is enforced in the ContactsController — the route layer
| stays open to all authenticated users so the typeahead search works
| universally across all booking/visa forms.
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    // Typeahead search used by the contact_id picker on booking/visa forms.
    // Must be registered before the resource route so it is not swallowed by
    // the {contact} show binding.
    Route::get('contacts/search', [ContactsController::class, 'search'])
        ->name('contacts.search');

    Route::resource('contacts', ContactsController::class);
});
