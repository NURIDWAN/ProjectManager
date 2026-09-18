<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_report_contributors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_report_id')->constrained('work_reports')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['work_report_id', 'user_id']);
        });

        DB::table('work_reports')
            ->select(['id', 'technician_id'])
            ->whereNotNull('technician_id')
            ->orderBy('id')
            ->chunkById(500, function ($reports): void {
                $rows = $reports->map(fn ($report) => [
                    'work_report_id' => $report->id,
                    'user_id' => $report->technician_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all();

                if ($rows !== []) {
                    DB::table('work_report_contributors')->insertOrIgnore($rows);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_report_contributors');
    }
};
