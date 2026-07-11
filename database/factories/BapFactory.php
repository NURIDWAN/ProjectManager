<?php

namespace Database\Factories;

use App\Models\Bap;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bap>
 */
class BapFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nomor_surat' => 'BAP/0001/01/2024',
            'client_id' => Client::factory(),
            'tanggal' => fake()->date(),
            'status' => Bap::STATUS_DRAFT,
            'work_report_ids' => [1],
            'signed_by' => null,
        ];
    }

    /**
     * Indicate that the BAP is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Bap::STATUS_APPROVED,
            'signed_by' => fake()->name(),
        ]);
    }
}
