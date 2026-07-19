<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
