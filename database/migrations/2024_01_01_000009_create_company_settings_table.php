<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        $defaults = [
            'company_name' => 'PT MAJU JAYA BERSAMA',
            'company_address' => 'Gedung Merah Putih Lt. 10',
            'company_address_2' => 'Jl. Laksamana Sukardi No. 5 Pluit Jakarta Utara',
            'company_phone' => '021 6519090',
            'company_email' => 'info@perusahaan.com',
            'company_logo' => '',
            'bank_name' => 'Mandiri Cabang Pluit Jakarta Utara',
            'bank_account_name' => 'PT MAJU JAYA BERSAMA',
            'bank_account_number' => '8349203918',
        ];

        foreach ($defaults as $key => $value) {
            DB::table('company_settings')->insert([
                'key' => $key,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
