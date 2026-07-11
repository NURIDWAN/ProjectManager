<?php

namespace App\Services;

interface InvoiceCalculationServiceInterface
{
    /**
     * Hitung line_total untuk satu item.
     * line_total = quantity * unit_price * (1 - discount_percent / 100)
     */
    public function calculateLineTotal(
        float $quantity,
        float $unitPrice,
        float $discountPercent = 0
    ): float;

    /**
     * Hitung subtotal dari kumpulan line_totals.
     * subtotal = sum(line_totals)
     */
    public function calculateSubtotal(array $lineTotals): float;

    /**
     * Hitung PPN.
     * ppn = (subtotal - discountTotal) * 0.11
     */
    public function calculatePpn(float $subtotal, float $discountTotal = 0): float;

    /**
     * Hitung grand total.
     * grand_total = subtotal - discountTotal + ppn
     */
    public function calculateGrandTotal(
        float $subtotal,
        float $discountTotal,
        float $ppn
    ): float;
}
