<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('description')->nullable()->after('service_id');
            $table->string('unit', 50)->nullable()->after('description');
        });

        DB::table('invoice_items')
            ->orderBy('id')
            ->chunkById(100, function ($items): void {
                foreach ($items as $item) {
                    $service = DB::table('services')->where('id', $item->service_id)->first(['name', 'unit']);

                    if ($service) {
                        DB::table('invoice_items')->where('id', $item->id)->update([
                            'description' => $service->name,
                            'unit' => $service->unit,
                        ]);
                    }
                }
            });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // service_id tetap nullable agar rollback tidak menghapus item manual yang sudah dibuat.
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn(['description', 'unit']);
        });
    }
};
