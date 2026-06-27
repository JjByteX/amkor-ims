<?php

return [
    'name' => 'Leave',

    /*
    |--------------------------------------------------------------------------
    | Leave module config
    |--------------------------------------------------------------------------
    */

    // Allow employees to file retroactive leave requests (past date_from).
    // When false, a client-side warning is shown but filing is still allowed.
    'allow_retroactive' => true,

    // Number of days before/after an employee's birthday that Birthday Leave
    // can be filed. 0 = only on the actual birthday.
    'birthday_leave_window_days' => 7,
];
