<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('gig_workforce_assignments')) {
            Schema::create('gig_workforce_assignments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('gig_user_id')->index();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('assigned_by')->nullable()->index();
                $table->timestamps();
                $table->unique(['gig_user_id', 'company_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gig_workforce_assignments');
    }
};
