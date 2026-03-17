<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DefaultCompanySeeder extends Seeder
{
    public function run(): void
    {
        $existing = User::where('type', 'company')->where('name', 'Default Company')->first();
        if ($existing) {
            return;
        }
        $owner = User::where('type', 'superadmin')->first();
        if (!$owner) {
            return;
        }
        $company = User::create([
            'name' => 'Default Company',
            'email' => 'default-company@example.com',
            'password' => Hash::make('password'),
            'type' => 'company',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        defaultRoleAndSetting($company);
    }
}
