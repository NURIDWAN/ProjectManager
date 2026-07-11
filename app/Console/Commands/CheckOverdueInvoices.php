<?php

namespace App\Console\Commands;

use App\Services\OverdueDetectionServiceInterface;
use Illuminate\Console\Command;

class CheckOverdueInvoices extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'invoice:check-overdue';

    /**
     * The console command description.
     */
    protected $description = 'Check unpaid invoices past due date and update status to overdue';

    /**
     * Execute the console command.
     */
    public function handle(OverdueDetectionServiceInterface $service): int
    {
        $count = $service->detectAndUpdateOverdue();

        $this->info("Updated {$count} invoices to overdue status.");

        return Command::SUCCESS;
    }
}
