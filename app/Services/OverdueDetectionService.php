<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Support\Carbon;

class OverdueDetectionService implements OverdueDetectionServiceInterface
{
    /**
     * Cek dan update semua invoice unpaid yang sudah melewati due_date.
     * Return jumlah invoice yang di-update ke overdue.
     */
    public function detectAndUpdateOverdue(): int
    {
        return Invoice::where('status', Invoice::STATUS_UNPAID)
            ->whereNotNull('due_date')
            ->where('due_date', '<', Carbon::today())
            ->update(['status' => Invoice::STATUS_OVERDUE]);
    }
}
