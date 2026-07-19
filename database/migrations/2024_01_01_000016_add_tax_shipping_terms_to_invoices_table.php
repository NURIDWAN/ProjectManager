<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('tax_percent', 5, 2)->default(11)->after('discount_total');
            $table->decimal('shipping_cost', 15, 2)->default(0)->after('ppn');
            $table->text('terms')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['tax_percent', 'shipping_cost', 'terms']);
        });
    }
};
