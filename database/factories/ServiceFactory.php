<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('SVC-###'),
            'name' => fake()->words(3, true),
            'unit' => fake()->randomElement(['paket', 'unit', 'jam', 'meter', 'buah']),
            'price' => fake()->numberBetween(50000, 5000000),
            'type' => fake()->randomElement([Service::TYPE_SERVICE, Service::TYPE_PRODUCT]),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the service is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
