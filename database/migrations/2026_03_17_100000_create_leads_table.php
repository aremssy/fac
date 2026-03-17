<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('leads')) {
            Schema::create('leads', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('contact_name')->nullable();
                $table->string('contact_email')->nullable();
                $table->string('phone')->nullable();
                $table->string('company_name')->nullable();
                $table->string('source')->nullable();
                $table->enum('status', ['new', 'in_progress', 'won', 'lost', 'converted'])->default('new');
                $table->unsignedBigInteger('assigned_to')->nullable()->index();
                $table->unsignedBigInteger('created_by')->index();
                $table->unsignedBigInteger('converted_company_user_id')->nullable()->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
