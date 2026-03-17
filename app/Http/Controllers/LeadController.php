<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use App\Models\Commission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::check()) {
            abort(403);
        }
        $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
        $query = Lead::query();
        if (Auth::user()->type === 'superadmin' || Auth::user()->type === 'admin' || Auth::user()->type === 'company') {
            $query->orderBy('id', 'desc');
        } elseif (Auth::user()->type === 'gig_workforce') {
            $query->where(function ($q) {
                $q->where('assigned_to', Auth::id())->orWhere('created_by', Auth::id());
            })->orderBy('id', 'desc');
        } else {
            abort(403);
        }
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        $leads = $query->paginate($perPage)->withQueryString();
        return Inertia::render('crm/leads/index', [
            'leads' => $leads,
            'filters' => [
                'status' => $request->status ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::check() || !in_array(Auth::user()->type, ['superadmin', 'gig_workforce'])) {
            abort(403);
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|exists:users,id',
        ]);
        $assigned = Auth::user()->type === 'gig_workforce' ? Auth::id() : ($validated['assigned_to'] ?? null);
        $lead = Lead::create(array_merge($validated, [
            'assigned_to' => $assigned,
            'created_by' => Auth::id(),
        ]));
        return redirect()->route('crm.leads.index')->with('success', __('Lead created'));
    }

    public function update(Request $request, Lead $lead)
    {
        if (!Auth::check()) {
            abort(403);
        }
        if (Auth::user()->type === 'gig_workforce' && $lead->assigned_to !== Auth::id()) {
            abort(403);
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'status' => 'required|in:new,in_progress,won,lost,converted',
        ]);
        $lead->update($validated);
        return redirect()->back()->with('success', __('Lead updated'));
    }

    public function convert(Request $request, Lead $lead)
    {
        if (!Auth::check()) {
            abort(403);
        }
        if (Auth::user()->type === 'gig_workforce' && $lead->assigned_to !== Auth::id()) {
            abort(403);
        }
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'commission_amount' => 'required|numeric|min:0',
        ]);
        $lead->status = 'converted';
        $lead->company_name = $validated['company_name'];
        $lead->converted_company_user_id = null;
        $lead->save();
        $commission = Commission::create([
            'lead_id' => $lead->id,
            'user_id' => $lead->assigned_to ?: Auth::id(),
            'amount' => $validated['commission_amount'],
            'status' => 'pending',
            'created_by' => Auth::id(),
        ]);
        return redirect()->route('crm.leads.index')->with('success', __('Lead converted'));
    }

    public function reassign(Request $request, Lead $lead)
    {
        if (!Auth::check() || Auth::user()->type !== 'superadmin') {
            abort(403);
        }
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);
        $lead->assigned_to = $validated['assigned_to'];
        $lead->save();
        return redirect()->back()->with('success', __('Lead reassigned'));
    }
}
