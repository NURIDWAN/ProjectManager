<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Bap extends Model
{
    use HasFactory;

    const STATUS_DRAFT = 'draft';
    const STATUS_APPROVED = 'approved';

    protected $fillable = [
        'nomor_surat',
        'client_id',
        'tanggal',
        'status',
        'work_report_ids',
        'signed_by',
    ];

    protected function casts(): array
    {
        return [
            'work_report_ids' => 'array',
            'tanggal' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
