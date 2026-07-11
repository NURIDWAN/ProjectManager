<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvoiceItem>
 */
class InvoiceItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 10);
        $unitPrice = fake()->numberBetween(100000, 5000000);
        $discountPercent = fake()->randomElement([0, 5, 10, 15, 20]);
        $lineTotal = round($quantity * $unitPrice * (1 - $discountPercent / 100), 2);

        return [
            'invoice_id' => Invoice::factory(),
            'service_id' => Service::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount_percent' => $discountPercent,
            'line_total' => $lineTotal,
        ];
    }
}
