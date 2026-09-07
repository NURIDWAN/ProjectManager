<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_reports', function (Blueprint $table) {
            // Handover: original technician who transferred this draft to the current technician_id
            $table->foreignId('transferred_from_id')
                ->nullable()
                ->after('technician_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('transferred_at')->nullable()->after('transferred_from_id');
        });
    }

    public function down(): void
    {
        Schema::table('work_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transferred_from_id');
            $table->dropColumn('transferred_at');
        });
    }
};
