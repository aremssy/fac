<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ConsultationController extends BaseController
{
    public function index(Request $request)
    {
        if (!Auth::check() || Auth::user()->type !== 'superadmin') {
            abort(403);
        }
        $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
        $query = Consultation::latest();
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%")
                  ->orWhere('service_of_interest', 'like', "%{$search}%");
            });
        }
        $consultations = $query->paginate($perPage)->withQueryString();
        return Inertia::render('superadmin/consultations/index', [
            'consultations' => $consultations,
            'filters' => [
                'search' => $request->search ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    public function submitApi(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'service_of_interest' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);
        $superAdmin = User::where('type', 'superadmin')->first();
        $createdBy = $superAdmin ? $superAdmin->id : null;
        $data = array_merge($validated, ['created_by' => $createdBy]);
        $consultation = Consultation::create($data);
        return response()->json([
            'success' => true,
            'id' => $consultation->id,
        ]);
    }
}
