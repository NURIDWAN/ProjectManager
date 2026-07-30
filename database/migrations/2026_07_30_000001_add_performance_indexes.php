<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_reports', function (Blueprint $table) {
            $table->index(['technician_id', 'created_at'], 'work_reports_technician_created_idx');
            $table->index(['status', 'created_at'], 'work_reports_status_created_idx');
            $table->index(['status', 'submitted_at'], 'work_reports_status_submitted_idx');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['status', 'due_date'], 'invoices_status_due_idx');
            $table->index(['status', 'paid_at'], 'invoices_status_paid_idx');
        });

        Schema::table('baps', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'baps_status_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('work_reports', function (Blueprint $table) {
            $table->dropIndex('work_reports_technician_created_idx');
            $table->dropIndex('work_reports_status_created_idx');
            $table->dropIndex('work_reports_status_submitted_idx');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_status_due_idx');
            $table->dropIndex('invoices_status_paid_idx');
        });

        Schema::table('baps', function (Blueprint $table) {
            $table->dropIndex('baps_status_created_idx');
        });
    }
};
