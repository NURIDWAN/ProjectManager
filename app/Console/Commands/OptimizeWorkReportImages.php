<?php

namespace App\Console\Commands;

use App\Models\WorkReport;
use App\Models\WorkReportPhoto;
use App\Services\PdfImageOptimizerInterface;
use Illuminate\Console\Command;

class OptimizeWorkReportImages extends Command
{
    protected $signature = 'work-reports:optimize-images';

    protected $description = 'Create compressed PDF derivatives for all existing work report photos';

    public function handle(PdfImageOptimizerInterface $optimizer): int
    {
        $paths = WorkReportPhoto::query()->distinct()->pluck('photo_path')->filter();

        WorkReport::query()->select(['id', 'before_photos', 'after_photos'])->chunkById(200, function ($reports) use (&$paths) {
            foreach ($reports as $report) {
                $paths = $paths
                    ->concat($report->before_photos ?? [])
                    ->concat($report->after_photos ?? []);
            }
        });

        $paths = $paths->filter(fn ($path) => is_string($path) && $path !== '')->unique()->values();
        $success = 0;
        $failed = 0;

        $this->withProgressBar($paths, function (string $path) use ($optimizer, &$success, &$failed) {
            try {
                $optimizer->optimize($path);
                $success++;
            } catch (\Throwable $exception) {
                $failed++;
                $this->newLine();
                $this->warn("Gagal memproses {$path}: {$exception->getMessage()}");
            }
        });

        $this->newLine(2);
        $this->info("Selesai: {$success} foto diproses, {$failed} gagal.");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
