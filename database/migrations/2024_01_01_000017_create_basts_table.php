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
        Schema::create('basts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bap_id')->unique()->constrained('baps')->onDelete('restrict');
            $table->string('document_number')->unique();
            $table->date('tanggal');
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->string('pihak_pertama_1_nama', 255);
            $table->string('pihak_pertama_1_jabatan', 255);
            $table->string('pihak_pertama_2_nama', 255);
            $table->string('pihak_pertama_2_jabatan', 255);
            $table->string('pihak_kedua_1_nama', 255);
            $table->string('pihak_kedua_1_jabatan', 255);
            $table->string('pihak_kedua_2_nama', 255);
            $table->string('pihak_kedua_2_jabatan', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('basts');
    }
};
