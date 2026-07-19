<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkReportPhoto extends Model
{
    use HasFactory;

    const TYPE_BEFORE = 'before';
    const TYPE_AFTER = 'after';

    protected $fillable = [
        'work_report_id',
        'type',
        'photo_path',
        'caption',
        'sort_order',
    ];

    protected $appends = ['photo_url'];

    public function workReport(): BelongsTo
    {
        return $this->belongsTo(WorkReport::class);
    }

    public function getPhotoUrlAttribute(): string
    {
        return '/storage/' . $this->photo_path;
    }
}
