<?php

namespace Tests\Unit;

use App\Services\InvoiceCalculationService;
use App\Services\InvoiceCalculationServiceInterface;
use PHPUnit\Framework\TestCase;

class InvoiceCalculationServiceTest extends TestCase
{
    private InvoiceCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new InvoiceCalculationService();
    }

    public function test_implements_interface(): void
    {
        $this->assertInstanceOf(InvoiceCalculationServiceInterface::class, $this->service);
    }

    // --- calculateLineTotal ---

    public function test_calculate_line_total_without_discount(): void
    {
        // 5 * 10000 * (1 - 0/100) = 50000
        $result = $this->service->calculateLineTotal(5, 10000, 0);
        $this->assertEquals(50000.0, $result);
    }

    public function test_calculate_line_total_with_discount(): void
    {
        // 3 * 20000 * (1 - 10/100) = 3 * 20000 * 0.9 = 54000
        $result = $this->service->calculateLineTotal(3, 20000, 10);
        $this->assertEquals(54000.0, $result);
    }

    public function test_calculate_line_total_with_100_percent_discount(): void
    {
        // 10 * 50000 * (1 - 100/100) = 0
        $result = $this->service->calculateLineTotal(10, 50000, 100);
        $this->assertEquals(0.0, $result);
    }

    public function test_calculate_line_total_with_decimal_quantity(): void
    {
        // 2.5 * 10000 * (1 - 5/100) = 2.5 * 10000 * 0.95 = 23750
        $result = $this->service->calculateLineTotal(2.5, 10000, 5);
        $this->assertEquals(23750.0, $result);
    }

    public function test_calculate_line_total_default_discount_is_zero(): void
    {
        // 4 * 15000 * (1 - 0/100) = 60000
        $result = $this->service->calculateLineTotal(4, 15000);
        $this->assertEquals(60000.0, $result);
    }

    // --- calculateSubtotal ---

    public function test_calculate_subtotal_with_multiple_items(): void
    {
        $lineTotals = [50000, 54000, 23750];
        $result = $this->service->calculateSubtotal($lineTotals);
        $this->assertEquals(127750.0, $result);
    }

    public function test_calculate_subtotal_with_single_item(): void
    {
        $result = $this->service->calculateSubtotal([100000]);
        $this->assertEquals(100000.0, $result);
    }

    public function test_calculate_subtotal_with_empty_array(): void
    {
        $result = $this->service->calculateSubtotal([]);
        $this->assertEquals(0.0, $result);
    }

    // --- calculatePpn ---

    public function test_calculate_ppn_without_discount(): void
    {
        // (100000 - 0) * 0.11 = 11000
        $result = $this->service->calculatePpn(100000, 0);
        $this->assertEquals(11000.0, $result);
    }

    public function test_calculate_ppn_with_discount(): void
    {
        // (100000 - 20000) * 0.11 = 80000 * 0.11 = 8800
        $result = $this->service->calculatePpn(100000, 20000);
        $this->assertEquals(8800.0, $result);
    }

    public function test_calculate_ppn_default_discount_is_zero(): void
    {
        // (50000 - 0) * 0.11 = 5500
        $result = $this->service->calculatePpn(50000);
        $this->assertEquals(5500.0, $result);
    }

    // --- calculateGrandTotal ---

    public function test_calculate_grand_total(): void
    {
        // 100000 - 20000 + 8800 = 88800
        $result = $this->service->calculateGrandTotal(100000, 20000, 8800);
        $this->assertEquals(88800.0, $result);
    }

    public function test_calculate_grand_total_without_discount(): void
    {
        // 100000 - 0 + 11000 = 111000
        $result = $this->service->calculateGrandTotal(100000, 0, 11000);
        $this->assertEquals(111000.0, $result);
    }

    // --- Integration scenario ---

    public function test_full_invoice_calculation_flow(): void
    {
        // Item 1: qty=2, price=50000, discount=10%
        $lineTotal1 = $this->service->calculateLineTotal(2, 50000, 10);
        // 2 * 50000 * 0.9 = 90000
        $this->assertEquals(90000.0, $lineTotal1);

        // Item 2: qty=1, price=100000, discount=0%
        $lineTotal2 = $this->service->calculateLineTotal(1, 100000, 0);
        // 1 * 100000 * 1.0 = 100000
        $this->assertEquals(100000.0, $lineTotal2);

        // Subtotal
        $subtotal = $this->service->calculateSubtotal([$lineTotal1, $lineTotal2]);
        // 90000 + 100000 = 190000
        $this->assertEquals(190000.0, $subtotal);

        // PPN with discount total of 10000
        $discountTotal = 10000;
        $ppn = $this->service->calculatePpn($subtotal, $discountTotal);
        // (190000 - 10000) * 0.11 = 180000 * 0.11 = 19800
        $this->assertEquals(19800.0, $ppn);

        // Grand total
        $grandTotal = $this->service->calculateGrandTotal($subtotal, $discountTotal, $ppn);
        // 190000 - 10000 + 19800 = 199800
        $this->assertEquals(199800.0, $grandTotal);
    }
}
