<?php

namespace Database\Seeders;

use App\Models\JobCategory;
use Illuminate\Database\Seeder;

class AcCategoryPresetSeeder extends Seeder
{
    /**
     * Set the preset_identifier on the AC maintenance job category.
     *
     * This seeder is idempotent — it uses updateOrCreate to ensure the
     * AC maintenance category exists and has its preset_identifier set.
     */
    public function run(): void
    {
        JobCategory::updateOrCreate(
            ['name' => 'Maintenance AC'],
            ['preset_identifier' => 'ac_maintenance']
        );
    }
}
