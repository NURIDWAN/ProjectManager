<?php

namespace Tests\Unit;

use App\Services\WorkReportImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WorkReportImageStorageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        config([
            'pdf.upload_images.max_dimension' => 1024,
            'pdf.upload_images.jpeg_quality' => 55,
        ]);
    }

    public function test_it_stores_uploaded_photo_as_resized_jpeg(): void
    {
        $upload = UploadedFile::fake()->image('large.png', 2400, 1200);

        $path = app(WorkReportImageStorage::class)->storeCompressed($upload, 'work-reports');

        Storage::disk('public')->assertExists($path);
        $this->assertStringStartsWith('work-reports/compressed/', $path);
        $this->assertStringEndsWith('.jpg', $path);
        $this->assertSame('image/jpeg', mime_content_type(Storage::disk('public')->path($path)));
        $this->assertSame(
            [1024, 512],
            array_slice(getimagesize(Storage::disk('public')->path($path)), 0, 2),
        );
    }

    public function test_pdf_optimizer_can_use_new_compressed_upload_directly(): void
    {
        config([
            'pdf.images.enabled' => true,
            'pdf.images.max_dimension' => 1024,
            'pdf.images.jpeg_quality' => 55,
        ]);
        $upload = UploadedFile::fake()->image('photo.png', 1600, 900);
        $path = app(WorkReportImageStorage::class)->storeCompressed($upload, 'work-reports/ac-units');

        $optimized = app(\App\Services\PdfImageOptimizer::class)->optimize($path);

        $this->assertSame(Storage::disk('public')->path($path), $optimized);
        $this->assertSame([], Storage::disk('public')->allFiles(config('pdf.images.directory')));
    }
}
