<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\JobCategory;
use App\Models\User;
use App\Models\WorkReport;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkReport>
 */
class WorkReportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'category_id' => JobCategory::factory(),
            'technician_id' => User::factory()->state(['role' => User::ROLE_TECHNICIAN]),
            'description' => fake()->paragraph(),
            'status' => WorkReport::STATUS_DRAFT,
            'submitted_at' => null,
            'before_photos' => null,
            'after_photos' => null,
        ];
    }

    /**
     * Indicate that the work report is submitted.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WorkReport::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ]);
    }
}
