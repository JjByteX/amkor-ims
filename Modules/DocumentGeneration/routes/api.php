<?php

use Illuminate\Support\Facades\Route;
use Modules\DocumentGeneration\Http\Controllers\DocumentGenerationController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('documentgenerations', DocumentGenerationController::class)->names('documentgeneration');
});
