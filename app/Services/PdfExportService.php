<?php

namespace App\Services;

use App\Models\Bap;
use App\Models\Bast;
use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\WorkReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Closure;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use Throwable;

class PdfExportService implements PdfExportServiceInterface
{
    public function __construct(
        private AcRecapAggregatorInterface $acRecapAggregator,
        private PdfImageOptimizerInterface $pdfImageOptimizer,
    ) {}

    public function generateBapPdf(int $bapId, bool $download = false): Response
    {
        $startedAt = hrtime(true);
        $bap = Bap::with('client')->findOrFail($bapId);
        $workReports = $this->loadWorkReports($bap->work_report_ids ?? []);
        $settings = CompanySetting::allSettings();
        $fingerprint = $this->fingerprint('bap', $bap, $workReports, $settings);
        $dataMilliseconds = $this->elapsedMilliseconds($startedAt);

        $content = $this->rememberGeneratedPdf('bap', $bap->id, $fingerprint, function () use (
            $bap,
            $workReports,
            $settings,
            $dataMilliseconds,
        ): string {
            $renderStartedAt = hrtime(true);
            $pdfPhotoPaths = $this->optimizedPhotoPaths($workReports);
            $imageMilliseconds = $this->elapsedMilliseconds($renderStartedAt);
            $acRecapRows = $this->acRecapAggregator->aggregate($workReports);

            $pdf = Pdf::loadView('pdf.bap', [
                'bap' => $bap,
                'client' => $bap->client,
                'workReports' => $workReports,
                'acRecapRows' => $acRecapRows,
                'settings' => $settings,
                'pdfPhotoPaths' => $pdfPhotoPaths,
            ]);
            $pdf->setPaper('A4', 'landscape');
            $content = $pdf->output();

            $this->logGenerationMetrics(
                'bap',
                $bap->id,
                $dataMilliseconds,
                $imageMilliseconds,
                $this->elapsedMilliseconds($renderStartedAt) - $imageMilliseconds,
                0,
                $content,
            );

            return $content;
        });

        $filename = 'BAP_'.str_replace('/', '-', $bap->nomor_surat).'.pdf';

        return $this->pdfResponse($content, $filename, $download);
    }

    public function generateInvoicePdf(int $invoiceId, bool $download = false): Response
    {
        $invoice = Invoice::with(['client', 'bap', 'items.service'])->findOrFail($invoiceId);
        $settings = CompanySetting::allSettings();

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'client' => $invoice->client,
            'items' => $invoice->items,
            'settings' => $settings,
        ]);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'Invoice_'.str_replace('/', '-', $invoice->invoice_number).'.pdf';

        return $this->pdfResponse($pdf->output(), $filename, $download);
    }

    public function generateBastPdf(int $bastId, bool $download = false): Response
    {
        $startedAt = hrtime(true);
        $bast = Bast::with(['client', 'bap'])->findOrFail($bastId);
        $workReports = $this->loadWorkReports($bast->bap?->work_report_ids ?? []);
        $settings = CompanySetting::allSettings();
        $fingerprint = $this->fingerprint('bast', $bast, $workReports, $settings, $bast->bap);
        $dataMilliseconds = $this->elapsedMilliseconds($startedAt);

        $content = $this->rememberGeneratedPdf('bast', $bast->id, $fingerprint, function () use (
            $bast,
            $workReports,
            $settings,
            $dataMilliseconds,
        ): string {
            $renderStartedAt = hrtime(true);
            $pdfPhotoPaths = $this->optimizedPhotoPaths($workReports);
            $imageMilliseconds = $this->elapsedMilliseconds($renderStartedAt);
            $acRecapRows = $this->acRecapAggregator->aggregate($workReports);
            $workItems = $bast->work_items ?? [];

            $coverHtml = view('pdf.bast.cover', [
                'bast' => $bast,
                'client' => $bast->client,
                'settings' => $settings,
            ])->render();
            $suratHtml = view('pdf.bast.surat', [
                'bast' => $bast,
                'client' => $bast->client,
                'workItems' => $workItems,
                'settings' => $settings,
            ])->render();
            $laporanHtml = view('pdf.bast.laporan', [
                'bast' => $bast,
                'client' => $bast->client,
                'workReports' => $workReports,
                'acRecapRows' => $acRecapRows,
                'settings' => $settings,
                'pdfPhotoPaths' => $pdfPhotoPaths,
            ])->render();

            $portraitHtml = view('pdf.bast.layout-portrait', [
                'bast' => $bast,
                'coverHtml' => $coverHtml,
                'suratHtml' => $suratHtml,
            ])->render();
            $portraitPdf = Pdf::loadHTML($portraitHtml);
            $portraitPdf->setPaper('A4', 'portrait');

            $landscapeHtml = view('pdf.bast.layout-landscape', [
                'bast' => $bast,
                'laporanHtml' => $laporanHtml,
            ])->render();
            $landscapePdf = Pdf::loadHTML($landscapeHtml);
            $landscapePdf->setPaper('A4', 'landscape');

            $tempPortrait = tempnam(sys_get_temp_dir(), 'bast_portrait_');
            $tempLandscape = tempnam(sys_get_temp_dir(), 'bast_landscape_');
            if ($tempPortrait === false || $tempLandscape === false) {
                if (is_string($tempPortrait)) {
                    @unlink($tempPortrait);
                }
                if (is_string($tempLandscape)) {
                    @unlink($tempLandscape);
                }
                throw new \RuntimeException('Unable to create temporary files for the BAST PDF.');
            }

            $portraitContent = $portraitPdf->output();
            $landscapeContent = $landscapePdf->output();
            $renderMilliseconds = $this->elapsedMilliseconds($renderStartedAt) - $imageMilliseconds;
            $mergeStartedAt = hrtime(true);

            try {
                file_put_contents($tempPortrait, $portraitContent);
                file_put_contents($tempLandscape, $landscapeContent);

                $merger = new Fpdi;
                $this->appendPdfPages($merger, $tempPortrait);
                $this->appendPdfPages($merger, $tempLandscape);
                $content = $merger->Output('S');
            } finally {
                @unlink($tempPortrait);
                @unlink($tempLandscape);
            }

            $this->logGenerationMetrics(
                'bast',
                $bast->id,
                $dataMilliseconds,
                $imageMilliseconds,
                $renderMilliseconds,
                $this->elapsedMilliseconds($mergeStartedAt),
                $content,
            );

            return $content;
        });

        $filename = 'BAST_'.str_replace('/', '-', $bast->document_number).'.pdf';

        return $this->pdfResponse($content, $filename, $download);
    }

    private function loadWorkReports(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        $reports = WorkReport::with(['category', 'technician', 'beforePhotoItems', 'afterPhotoItems'])
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        return collect($ids)
            ->map(fn ($id) => $reports->get($id))
            ->filter()
            ->values();
    }

    private function optimizedPhotoPaths(Collection $workReports): array
    {
        $paths = [];

        foreach ($workReports as $report) {
            foreach ($report->beforePhotoItems->concat($report->afterPhotoItems) as $photo) {
                $paths[$photo->id] = $this->pdfImageOptimizer->optimize($photo->photo_path);
            }
        }

        return $paths;
    }

    private function fingerprint(
        string $type,
        Model $document,
        Collection $workReports,
        array $settings,
        ?Model $parent = null,
    ): string {
        $disk = Storage::disk('public');
        $reportData = $workReports->map(function (WorkReport $report) use ($disk): array {
            $photos = $report->beforePhotoItems
                ->concat($report->afterPhotoItems)
                ->unique('id')
                ->map(function ($photo) use ($disk): array {
                    $metadata = ['exists' => $disk->exists($photo->photo_path)];

                    if ($metadata['exists']) {
                        try {
                            $metadata['size'] = $disk->size($photo->photo_path);
                            $metadata['modified'] = $disk->lastModified($photo->photo_path);
                        } catch (Throwable) {
                            $metadata['unreadable'] = true;
                        }
                    }

                    return [
                        'attributes' => $photo->getAttributes(),
                        'file' => $metadata,
                    ];
                })
                ->values()
                ->all();

            return [
                'attributes' => $report->getAttributes(),
                'category' => $report->category?->getAttributes(),
                'technician' => $report->technician?->getAttributes(),
                'photos' => $photos,
            ];
        })->all();

        return hash('sha256', serialize([
            'version' => (string) config('pdf.cache_version', '1'),
            'type' => $type,
            'document' => $document->getAttributes(),
            'client' => $document->client?->getAttributes(),
            'parent' => $parent?->getAttributes(),
            'reports' => $reportData,
            'settings' => $settings,
        ]));
    }

    private function rememberGeneratedPdf(string $type, int $id, string $fingerprint, Closure $generate): string
    {
        $cacheStartedAt = hrtime(true);

        if (! config('pdf.cache_enabled', true)) {
            return $generate();
        }

        $disk = Storage::disk('local');
        $directory = trim((string) config('pdf.cache_path', 'generated-pdfs'), '/')."/{$type}/{$id}";
        $path = "{$directory}/{$fingerprint}.pdf";

        if ($disk->exists($path)) {
            Log::info('PDF cache hit.', [
                'type' => $type,
                'id' => $id,
                'lookup_ms' => round($this->elapsedMilliseconds($cacheStartedAt), 2),
            ]);

            return $disk->get($path);
        }

        Log::info('PDF cache miss.', [
            'type' => $type,
            'id' => $id,
            'lookup_ms' => round($this->elapsedMilliseconds($cacheStartedAt), 2),
        ]);
        $lock = Cache::lock(
            "pdf-generation:{$type}:{$id}",
            (int) config('pdf.lock_seconds', 180),
        );

        try {
            return $lock->block((int) config('pdf.lock_wait_seconds', 30), function () use (
                $disk,
                $directory,
                $path,
                $generate,
            ): string {
                if ($disk->exists($path)) {
                    return $disk->get($path);
                }

                $content = $generate();
                $temporaryPath = "{$directory}/.".basename($path).'.'.bin2hex(random_bytes(6)).'.tmp';
                $disk->put($temporaryPath, $content);

                if (! $disk->move($temporaryPath, $path)) {
                    $disk->delete($temporaryPath);
                    throw new \RuntimeException('Unable to atomically store the generated PDF cache.');
                }

                foreach ($disk->files($directory) as $cachedPath) {
                    if ($cachedPath !== $path) {
                        $disk->delete($cachedPath);
                    }
                }

                return $content;
            });
        } catch (LockTimeoutException $exception) {
            Log::warning('Timed out waiting for PDF generation lock; rendering without cache.', [
                'type' => $type,
                'id' => $id,
                'exception' => $exception->getMessage(),
            ]);

            return $generate();
        }
    }

    private function appendPdfPages(Fpdi $merger, string $path): void
    {
        $pageCount = $merger->setSourceFile($path);

        for ($page = 1; $page <= $pageCount; $page++) {
            $templateId = $merger->importPage($page);
            $size = $merger->getTemplateSize($templateId);
            $merger->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $merger->useTemplate($templateId);
        }
    }

    private function logGenerationMetrics(
        string $type,
        int $id,
        float $dataMilliseconds,
        float $imageMilliseconds,
        float $renderMilliseconds,
        float $mergeMilliseconds,
        string $content,
    ): void {
        Log::info('PDF generated.', [
            'type' => $type,
            'id' => $id,
            'data_ms' => round($dataMilliseconds, 2),
            'images_ms' => round($imageMilliseconds, 2),
            'render_ms' => round($renderMilliseconds, 2),
            'merge_ms' => round($mergeMilliseconds, 2),
            'bytes' => strlen($content),
            'peak_memory_bytes' => memory_get_peak_usage(true),
        ]);
    }

    private function elapsedMilliseconds(int $startedAt): float
    {
        return (hrtime(true) - $startedAt) / 1_000_000;
    }

    private function pdfResponse(string $content, string $filename, bool $download): Response
    {
        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($download ? 'attachment' : 'inline').'; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
