<?php

namespace App\Http\Controllers;

use App\Models\GigWorkforceAssignment;
use App\Models\Lead;
use App\Models\Commission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GigWorkforceController extends Controller
{
    public function dashboard(Request $request)
    {
        if (!Auth::check() || Auth::user()->type !== 'gig_workforce') {
            abort(403);
        }
        $assignedCompaniesCount = GigWorkforceAssignment::where('gig_user_id', Auth::id())->count();
        $leadsTotal = Lead::where('assigned_to', Auth::id())->count();
        $leadsConverted = Lead::where('assigned_to', Auth::id())->where('status', 'converted')->count();
        $leadsInProgress = Lead::where('assigned_to', Auth::id())->where('status', 'in_progress')->count();
        return Inertia::render('gig/dashboard', [
            'dashboard' => [
                'assigned_companies' => $assignedCompaniesCount,
                'leads_total' => $leadsTotal,
                'leads_converted' => $leadsConverted,
                'leads_in_progress' => $leadsInProgress,
            ],
        ]);
    }

    public function assignmentsIndex(Request $request)
    {
        if (!Auth::check() || Auth::user()->type !== 'superadmin') {
            abort(403);
        }
        $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
        $query = GigWorkforceAssignment::with(['user', 'company', 'assigner'])->orderBy('id', 'desc');
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('company', function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
                });
            });
        }
        $assignments = $query->paginate($perPage)->withQueryString();
        $gigUsers = \App\Models\User::where('type', 'gig_workforce')->select('id', 'name')->orderBy('name')->get();
        $assignedCompanyIds = \App\Models\GigWorkforceAssignment::pluck('company_id')->unique()->toArray();
        $unassignedCompanies = \App\Models\User::where('type', 'company')
            ->whereNotIn('id', $assignedCompanyIds)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
        return Inertia::render('superadmin/gig-assignments/index', [
            'assignments' => $assignments,
            'filters' => [
                'search' => $request->search ?? '',
                'per_page' => $perPage,
            ],
            'gigUsers' => $gigUsers,
            'unassignedCompanies' => $unassignedCompanies,
        ]);
    }

    public function commissionsIndex(Request $request)
    {
        if (!Auth::check() || Auth::user()->type !== 'gig_workforce') {
            abort(403);
        }
        $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
        $query = Commission::with(['lead'])->where('user_id', Auth::id())->orderBy('id', 'desc');
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        $commissions = $query->paginate($perPage)->withQueryString();
        return Inertia::render('gig/commissions/index', [
            'commissions' => $commissions,
            'filters' => [
                'status' => $request->status ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    public function assignCompany(Request $request)
    {
        if (!Auth::check() || Auth::user()->type !== 'superadmin') {
            abort(403);
        }
        $validated = $request->validate([
            'gig_user_id' => 'required|exists:users,id',
            'company_id' => 'required|exists:users,id',
        ]);
        $assignment = GigWorkforceAssignment::firstOrCreate([
            'gig_user_id' => $validated['gig_user_id'],
            'company_id' => $validated['company_id'],
        ], [
            'assigned_by' => Auth::id(),
        ]);
        return response()->json(['success' => true, 'id' => $assignment->id]);
    }

    public function destroyAssignment(GigWorkforceAssignment $assignment)
    {
        if (!Auth::check() || Auth::user()->type !== 'superadmin') {
            abort(403);
        }
        $assignment->delete();
        return response()->json(['success' => true]);
    }
}
