<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bast extends Model
{
    use HasFactory;

    protected $fillable = [
        'bap_id',
        'document_number',
        'tanggal',
        'client_id',
        'work_items',
        'pihak_pertama_1_nama',
        'pihak_pertama_1_jabatan',
        'pihak_pertama_2_nama',
        'pihak_pertama_2_jabatan',
        'pihak_kedua_1_nama',
        'pihak_kedua_1_jabatan',
        'pihak_kedua_2_nama',
        'pihak_kedua_2_jabatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'work_items' => 'array',
        ];
    }

    public function bap(): BelongsTo
    {
        return $this->belongsTo(Bap::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
