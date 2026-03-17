<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('commissions')) {
            Schema::create('commissions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('lead_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->decimal('amount', 12, 2)->default(0);
                $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');
                $table->timestamp('paid_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
