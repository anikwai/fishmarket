<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateUser;
use App\Actions\DeleteUser;
use App\Actions\UpdateUser;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\DeleteUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

final readonly class UserController
{
    public function index(Request $request): Response
    {
        Gate::authorize('view users');

        $perPageInput = $request->get('per_page', 10);
        $perPage = is_numeric($perPageInput) && in_array((int) $perPageInput, [10, 15, 20, 25, 50], true) ? (int) $perPageInput : 10;

        $roleFilter = (string) Str::of($request->string('role')->value())->trim();

        $query = User::query()
            ->with('roles.permissions')
            ->when($request->search, fn (\Illuminate\Database\Eloquent\Builder $query, mixed $search) => $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search): void {
                $searchStr = is_string($search) ? $search : '';
                $q->where('name', 'like', '%'.$searchStr.'%')
                    ->orWhere('email', 'like', '%'.$searchStr.'%');
            }))
            ->when($roleFilter !== '' && $roleFilter !== 'all', function (\Illuminate\Database\Eloquent\Builder $query) use ($roleFilter): void {
                if ($roleFilter === 'none') {
                    $query->whereDoesntHave('roles');

                    return;
                }

                $query->whereHas('roles', fn (\Illuminate\Database\Eloquent\Builder $roleQuery): \Illuminate\Database\Eloquent\Builder => $roleQuery->where('name', $roleFilter));
            });

        // Handle sorting
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'asc');

        if (is_string($sortBy) && is_string($sortDir) && in_array($sortDir, ['asc', 'desc'], true)) {
            $allowedSortColumns = [
                'name' => 'name',
                'email' => 'email',
                'created_at' => 'created_at',
            ];

            if (isset($allowedSortColumns[$sortBy])) {
                $query->orderBy($allowedSortColumns[$sortBy], $sortDir);
            }
        } else {
            $query->latest();
        }

        $users = $query->paginate($perPage);
        $roles = Role::with('permissions')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('user/create');
    }

    public function store(CreateUserRequest $request, CreateUser $action): RedirectResponse
    {
        /** @var array<string, mixed> $attributes */
        $attributes = $request->safe()->except('password');

        $user = $action->handle(
            $attributes,
            $request->string('password')->value(),
        );

        Auth::login($user);

        $request->session()->regenerate();

        // Redirect users without roles to pending access page
        if ($user->roles()->count() === 0) {
            return to_route('pending-access');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function storeAdmin(StoreUserRequest $request, CreateUser $action): RedirectResponse
    {
        Gate::authorize('create users');

        /** @var array<string, mixed> $attributes */
        $attributes = $request->safe()->except(['password', 'role']);

        $roleName = $request->string('role')->value() ?: null;

        $action->handle(
            $attributes,
            $request->string('password')->value(),
            $roleName,
        );

        return to_route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        Gate::authorize('update users');

        $user->load('roles');
        $roles = Role::all();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUser $action): RedirectResponse
    {
        Gate::authorize('update users');

        $action->handle($user, $request->validated());

        return to_route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user, DeleteUser $action): RedirectResponse
    {
        Gate::authorize('delete users');

        $action->handle($user);

        return to_route('users.index')->with('success', 'User deleted successfully.');
    }

    public function destroySelf(DeleteUserRequest $request, #[CurrentUser] User $user, DeleteUser $action): RedirectResponse
    {
        Auth::logout();

        $action->handle($user);

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('home');
    }
}
