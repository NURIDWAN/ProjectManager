<?php

namespace Tests\Unit;

use App\Services\PdfImageOptimizer;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PdfImageOptimizerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        config([
            'pdf.images.enabled' => true,
            'pdf.images.max_dimension' => 1600,
            'pdf.images.jpeg_quality' => 80,
        ]);
    }

    public function test_it_creates_and_reuses_a_resized_jpeg_without_changing_the_original(): void
    {
        $sourcePath = 'work-reports/large.png';
        $this->createPng(Storage::disk('public')->path($sourcePath), 2400, 1200);
        $optimizer = app(PdfImageOptimizer::class);

        $firstPath = $optimizer->optimize($sourcePath);
        $secondPath = $optimizer->optimize($sourcePath);

        $this->assertSame($firstPath, $secondPath);
        $this->assertSame([1600, 800], array_slice(getimagesize($firstPath), 0, 2));
        $this->assertSame(
            [2400, 1200],
            array_slice(getimagesize(Storage::disk('public')->path($sourcePath)), 0, 2),
        );
        $this->assertCount(1, Storage::disk('public')->allFiles(config('pdf.images.directory')));
    }

    public function test_it_removes_derivatives_without_removing_the_original(): void
    {
        $sourcePath = 'work-reports/photo.png';
        $this->createPng(Storage::disk('public')->path($sourcePath), 100, 100);
        $optimizer = app(PdfImageOptimizer::class);
        $optimizer->optimize($sourcePath);

        $optimizer->deleteDerivatives($sourcePath);

        Storage::disk('public')->assertExists($sourcePath);
        $this->assertSame([], Storage::disk('public')->allFiles(config('pdf.images.directory')));
    }

    private function createPng(string $path, int $width, int $height): void
    {
        $directory = dirname($path);
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $image = imagecreatetruecolor($width, $height);
        $color = imagecolorallocate($image, 20, 120, 200);
        imagefill($image, 0, 0, $color);
        imagepng($image, $path);
        imagedestroy($image);
    }
}
