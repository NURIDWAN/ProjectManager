<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static static create(array $attributes = [])
 * @method static static|null find(mixed $id, array|string $columns = ['*'])
 * @method static static findOrFail(mixed $id, array|string $columns = ['*'])
 */
class WorkReport extends Model
{
    use HasFactory;

    const STATUS_DRAFT = 'draft';
    const STATUS_SUBMITTED = 'submitted';

    protected $fillable = [
        'client_id',
        'category_id',
        'technician_id',
        'transferred_from_id',
        'transferred_at',
        'description',
        'area',
        'preset_data',
        'status',
        'submitted_at',
        'before_photos',
        'after_photos',
    ];

    protected function casts(): array
    {
        return [
            'before_photos' => 'array',
            'after_photos' => 'array',
            'preset_data' => 'array',
            'submitted_at' => 'datetime',
            'transferred_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'category_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function transferredFrom(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transferred_from_id');
    }

    public function contributors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'work_report_contributors')
            ->select(['users.id', 'users.name'])
            ->orderBy('users.name')
            ->withTimestamps();
    }

    public function photos(): HasMany
    {
        return $this->hasMany(WorkReportPhoto::class)->orderBy('sort_order');
    }

    public function beforePhotoItems(): HasMany
    {
        return $this->hasMany(WorkReportPhoto::class)
            ->where('type', WorkReportPhoto::TYPE_BEFORE)
            ->orderBy('sort_order');
    }

    public function afterPhotoItems(): HasMany
    {
        return $this->hasMany(WorkReportPhoto::class)
            ->where('type', WorkReportPhoto::TYPE_AFTER)
            ->orderBy('sort_order');
    }
}
