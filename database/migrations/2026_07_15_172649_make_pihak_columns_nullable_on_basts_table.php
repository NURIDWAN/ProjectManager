<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('basts', function (Blueprint $table) {
            $table->string('pihak_pertama_1_nama')->nullable()->change();
            $table->string('pihak_pertama_1_jabatan')->nullable()->change();
            $table->string('pihak_pertama_2_nama')->nullable()->change();
            $table->string('pihak_pertama_2_jabatan')->nullable()->change();
            $table->string('pihak_kedua_1_nama')->nullable()->change();
            $table->string('pihak_kedua_1_jabatan')->nullable()->change();
            $table->string('pihak_kedua_2_nama')->nullable()->change();
            $table->string('pihak_kedua_2_jabatan')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('basts', function (Blueprint $table) {
            $table->string('pihak_pertama_1_nama')->nullable(false)->change();
            $table->string('pihak_pertama_1_jabatan')->nullable(false)->change();
            $table->string('pihak_pertama_2_nama')->nullable(false)->change();
            $table->string('pihak_pertama_2_jabatan')->nullable(false)->change();
            $table->string('pihak_kedua_1_nama')->nullable(false)->change();
            $table->string('pihak_kedua_1_jabatan')->nullable(false)->change();
            $table->string('pihak_kedua_2_nama')->nullable(false)->change();
            $table->string('pihak_kedua_2_jabatan')->nullable(false)->change();
        });
    }
};
