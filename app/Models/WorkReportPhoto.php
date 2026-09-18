<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereKey(mixed $id)
 * @method static bool insert(array $values)
 */
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
