<?php

namespace App\Services;

class InvoiceCalculationService implements InvoiceCalculationServiceInterface
{
    /**
     * Hitung line_total untuk satu item.
     * line_total = quantity * unit_price * (1 - discount_percent / 100)
     */
    public function calculateLineTotal(
        float $quantity,
        float $unitPrice,
        float $discountPercent = 0
    ): float {
        return round($quantity * $unitPrice * (1 - $discountPercent / 100), 2);
    }

    /**
     * Hitung subtotal dari kumpulan line_totals.
     * subtotal = sum(line_totals)
     */
    public function calculateSubtotal(array $lineTotals): float
    {
        return round(array_sum($lineTotals), 2);
    }

    /**
     * Hitung PPN.
     * ppn = (subtotal - discountTotal) * 0.11
     */
    public function calculatePpn(float $subtotal, float $discountTotal = 0): float
    {
        return round(($subtotal - $discountTotal) * 0.11, 2);
    }

    /**
     * Hitung grand total.
     * grand_total = subtotal - discountTotal + ppn
     */
    public function calculateGrandTotal(
        float $subtotal,
        float $discountTotal,
        float $ppn
    ): float {
        return round($subtotal - $discountTotal + $ppn, 2);
    }
}
