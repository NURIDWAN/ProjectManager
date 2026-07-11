<?php

namespace App\Services;

interface OverdueDetectionServiceInterface
{
    /**
     * Cek dan update semua invoice unpaid yang sudah melewati due_date.
     * Return jumlah invoice yang di-update ke overdue.
     */
    public function detectAndUpdateOverdue(): int;
}
