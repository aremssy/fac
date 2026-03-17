<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConsultationController;

Route::post('consultations', [ConsultationController::class, 'submitApi'])->middleware('basic.static')->name('api.consultations.submit');

Route::get('consultations', function () {
    return response()->json(['status' => 'ok']);
})->name('api.consultations.health');

Route::options('consultations', function () {
    return response()->noContent();
})->name('api.consultations.options');
