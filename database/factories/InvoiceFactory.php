<?php

namespace Database\Factories;

use App\Models\Bap;
use App\Models\Client;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'invoice_number' => 'INV/' . fake()->unique()->numerify('####') . '/01/2024',
            'bap_id' => Bap::factory()->approved(),
            'client_id' => Client::factory(),
            'subtotal' => 1000000,
            'discount_total' => 0,
            'ppn' => 110000,
            'grand_total' => 1110000,
            'due_date' => null,
            'status' => Invoice::STATUS_DRAFT,
            'paid_at' => null,
        ];
    }

    /**
     * Indicate that the invoice is unpaid.
     */
    public function unpaid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Invoice::STATUS_UNPAID,
            'due_date' => now()->addDays(30),
        ]);
    }

    /**
     * Indicate that the invoice is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Invoice::STATUS_OVERDUE,
            'due_date' => now()->subDays(5),
        ]);
    }

    /**
     * Indicate that the invoice is paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Invoice::STATUS_PAID,
            'due_date' => now()->subDays(10),
            'paid_at' => now(),
        ]);
    }
}
