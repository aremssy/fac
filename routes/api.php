<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConsultationController;

Route::post('consultations', [ConsultationController::class, 'submitApi'])->name('api.consultations.submit');
