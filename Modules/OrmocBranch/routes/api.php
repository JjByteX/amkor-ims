<?php

use Illuminate\Support\Facades\Route;
use Modules\OrmocBranch\Http\Controllers\OrmocBranchController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('ormocbranches', OrmocBranchController::class)->names('ormocbranch');
});
