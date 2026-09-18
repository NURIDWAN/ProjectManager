<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static static|null find(mixed $id, array|string $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Collection<int, static> select(array|string ...$columns)
 */
class JobCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'preset_identifier',
    ];

    public function workReports(): HasMany
    {
        return $this->hasMany(WorkReport::class, 'category_id');
    }

    public function isSystemManaged(): bool
    {
        return filled($this->preset_identifier);
    }
}
