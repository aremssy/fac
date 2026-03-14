<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class UserController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = Auth::user();
        if (Auth::user()->can('manage-users')) {
            $authUserRole = $authUser->roles->first()?->name;
            // Allow superadmin, admin, product-manager, contact-manager, viewer
            if (!$authUser->hasPermissionTo('view-users')) {
                abort(403, 'Unauthorized Access Prevented');
            }

            $userQuery = User::with(['roles', 'creator'])->latest();
            if (Auth::user()->can('manage-any-users')) {
                if ($authUser->type !== 'superadmin') {
                    $userQuery->whereIn('created_by', getCompanyAndUsersId());
                }
            } elseif (Auth::user()->can('manage-own-users')) {
                $userQuery->where('created_by', Auth::id());
            } else {
                $userQuery->whereRaw('1 = 0');
            }

            // Handle search
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $userQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Handle role filter
            if ($request->has('role') && $request->role !== 'all') {
                $userQuery->whereHas('roles', function ($q) use ($request) {
                    $q->where('roles.id', $request->role);
                });
            }

            // Handle sorting
            if ($request->has('sort_field') && $request->has('sort_direction')) {
                $userQuery->orderBy($request->sort_field, $request->sort_direction);
            }

            // Handle pagination
            $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
            $users = $userQuery->where('type', '!=', 'employee')->paginate($perPage)->withQueryString();

            # Roles listing - Get all roles without filtering
            if ($authUserRole == 'company') {
                // $roles = Role::where('created_by', $authUser->id)->get();
                $roles = Role::whereIn('created_by', getCompanyAndUsersId())
                    ->where('name', '!=', 'employee')
                    ->get();
            } else {
                $roles = Role::where('name', '!=', 'employee')->whereIn('created_by', getCompanyAndUsersId())->get();
            }

            // Get plan limits for company users and staff users (only in SaaS mode)
            $planLimits = null;
            if (isSaas()) {
                if ($authUser->type === 'company' && $authUser->plan) {
                    $currentUserCount = User::whereIn('created_by', getCompanyAndUsersId())->where('type', '!=', 'employee')->count();
                    $planLimits = [
                        'current_users' => $currentUserCount,
                        'max_users' => $authUser->plan->max_users,
                        'can_create' => $currentUserCount < $authUser->plan->max_users
                    ];
                }
                // Check for staff users (created by company users)
                elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
                    $companyUser = User::find($authUser->created_by);
                    if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                        $currentUserCount = User::whereIn('created_by', getCompanyAndUsersId())->where('type', '!=', 'employee')->count();
                        $planLimits = [
                            'current_users' => $currentUserCount,
                            'max_users' => $companyUser->plan->max_users,
                            'can_create' => $currentUserCount < $companyUser->plan->max_users
                        ];
                    }
                }
            }


            return Inertia::render('users/index', [
                'users' => $users,
                'roles' => $roles,
                'planLimits' => $planLimits,
                'filters' => [
                    'search' => $request->search ?? '',
                    'role' => $request->role ?? 'all',
                    'per_page' => $perPage,
                    'sort_field' => $request->sort_field ?? 'created_at',
                    'sort_direction' => $request->sort_direction ?? 'desc',
                ],
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Quickly create an Admin user (superadmin only) with sane defaults.
     */
    public function storeAdmin(Request $request)
    {
        if (!Auth::user()->can('create-users')) {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
        $authUser = Auth::user();
        if ($authUser->type !== 'superadmin') {
            abort(403, 'Only superadmin can create admin users.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
        ]);

        $plainPassword = $validated['password'] ?? Str::random(12);

        $companySettings = settings();
        $userLang = isset($companySettings['defaultLanguage']) ? $companySettings['defaultLanguage'] : $authUser->lang;

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = Hash::make($plainPassword);
        $user->created_by = $authUser->id;
        $user->lang = $userLang;
        $user->status = 'active';
        $user->is_enable_login = 1;
        $user->email_verified_at = Carbon::now();
        $user->save();

        $adminRole = Role::whereRaw('LOWER(name) IN (?, ?)', ['superadmin', 'super-admin'])->first();

        if ($adminRole) {
            $user->roles()->sync([$adminRole->id]);
            $user->type = $adminRole->name;
            $user->save();
        } else {
            // Fallback: set type explicitly if role is missing
            $user->type = 'admin';
            $user->save();
        }

        event(new \App\Events\UserCreated($user, $plainPassword));

        if (session()->has('email_error')) {
            return redirect()->route('users.index')->with('warning', __('Admin created, but welcome email failed: ') . session('email_error'));
        }

        return redirect()->route('users.index')->with('success', __('Admin user created successfully'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        // Set user language same as creator (company)
        $authUser = Auth::user();
        if (Auth::user()->can('create-users')) {
            $companySettings = settings();
            $userLang = isset($companySettings['defaultLanguage']) ? $companySettings['defaultLanguage'] : $authUser->lang;
            // Check plan limits for company users (only in SaaS mode)
            if (isSaas() && $authUser->type === 'company' && $authUser->plan) {
                $currentUserCount = User::where('created_by', $authUser->id)->count();
                $maxUsers = $authUser->plan->max_users;

                if ($currentUserCount >= $maxUsers) {
                    return redirect()->back()->with('error', __('User limit exceeded. Your plan allows maximum :max users. Please upgrade your plan.', ['max' => $maxUsers]));
                }
            }
            // Check plan limits for staff users (created by company users)
            elseif (isSaas() && $authUser->type !== 'superadmin' && $authUser->created_by) {
                $companyUser = User::find($authUser->created_by);
                if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                    $currentUserCount = User::where('created_by', $companyUser->id)->count();
                    $maxUsers = $companyUser->plan->max_users;

                    if ($currentUserCount >= $maxUsers) {
                        return redirect()->back()->with('error', __('User limit exceeded. Your company plan allows maximum :max users. Please contact your administrator.', ['max' => $maxUsers]));
                    }
                }
            }

            if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                $created_by = auth()->user()->created_by;
            } else {
                $created_by = auth()->id();
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'created_by' => creatorId(),
                'lang' => $userLang,
            ]);

            if ($user && $request->roles) {
                // Convert role names to IDs for syncing
                $role = Role::where('id', $request->roles)
                    ->where('created_by', $created_by)->first();

                $user->roles()->sync([$role->id]);
                $user->type = $role->name;
                $user->save();

                // Trigger email notification
                event(new \App\Events\UserCreated($user, $request->password));

                // Check for email errors
                if (session()->has('email_error')) {
                    return redirect()->route('users.index')->with('warning', __('User created successfully, but welcome email failed: ') . session('email_error'));
                }

                return redirect()->route('users.index')->with('success', __('User created with roles'));
            }
            return redirect()->back()->with('error', __('Unable to create User. Please try again!'));
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        if (Auth::user()->can('edit-users')) {
            if ($user) {
                $user->name = $request->name;
                $user->email = $request->email;

                // find and syncing role
                if ($request->roles) {
                    if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                        $created_by = auth()->user()->created_by;
                    } else {
                        $created_by = auth()->id();
                    }
                    $role = Role::where('id', $request->roles)
                        ->where('created_by', $created_by)->first();

                    $user->roles()->sync([$role->id]);
                    $user->type = $role->name;
                }

                $user->save();
                return redirect()->route('users.index')->with('success', __('User updated with roles'));
            }
            return redirect()->back()->with('error', __('Unable to update User. Please try again!'));
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if (Auth::user()->can('delete-users')) {
            if ($user) {
                $user->delete();
                return redirect()->route('users.index')->with('success', __('User deleted with roles'));
            }
            return redirect()->back()->with('error', __('Unable to delete User. Please try again!'));
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('users.index')->with('success', __('Password reset successfully'));
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return redirect()->route('users.index')->with('success', __('User status updated successfully'));
    }

    // switchBusiness method removed
}
