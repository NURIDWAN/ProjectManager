<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PdfImageOptimizer implements PdfImageOptimizerInterface
{
    public function optimize(string $sourcePath): string
    {
        $disk = Storage::disk('public');

        if (! $disk->exists($sourcePath)) {
            return $disk->path($sourcePath);
        }

        $sourceAbsolutePath = $disk->path($sourcePath);

        if (! config('pdf.images.enabled', true) || ! extension_loaded('gd')) {
            return $sourceAbsolutePath;
        }

        $signature = sha1(implode('|', [
            $sourcePath,
            (string) $disk->size($sourcePath),
            (string) $disk->lastModified($sourcePath),
            (string) config('pdf.images.max_dimension', 1600),
            (string) config('pdf.images.jpeg_quality', 80),
        ]));
        $prefix = sha1($sourcePath);
        $directory = trim((string) config('pdf.images.directory', 'work-reports/pdf'), '/');
        $derivativePath = "{$directory}/{$prefix}/{$signature}.jpg";

        if ($disk->exists($derivativePath)) {
            return $disk->path($derivativePath);
        }

        try {
            $this->createDerivative($sourceAbsolutePath, $disk->path($derivativePath));
            $this->deleteDerivativesExcept($sourcePath, $derivativePath);

            return $disk->path($derivativePath);
        } catch (Throwable $exception) {
            Log::warning('PDF image optimization failed; using original image.', [
                'source' => $sourcePath,
                'exception' => $exception->getMessage(),
            ]);

            return $sourceAbsolutePath;
        }
    }

    public function deleteDerivatives(string $sourcePath): void
    {
        $disk = Storage::disk('public');
        $directory = trim((string) config('pdf.images.directory', 'work-reports/pdf'), '/');
        $disk->deleteDirectory($directory.'/'.sha1($sourcePath));
    }

    private function createDerivative(string $sourcePath, string $destinationPath): void
    {
        $contents = file_get_contents($sourcePath);
        $source = $contents === false ? false : imagecreatefromstring($contents);

        if ($source === false) {
            throw new \RuntimeException('The source image cannot be decoded by GD.');
        }

        try {
            $width = imagesx($source);
            $height = imagesy($source);
            $maxDimension = max(1, (int) config('pdf.images.max_dimension', 1600));
            $scale = min(1, $maxDimension / max($width, $height));
            $targetWidth = max(1, (int) round($width * $scale));
            $targetHeight = max(1, (int) round($height * $scale));
            $target = imagecreatetruecolor($targetWidth, $targetHeight);

            if ($target === false) {
                throw new \RuntimeException('Unable to allocate the optimized image.');
            }

            try {
                $white = imagecolorallocate($target, 255, 255, 255);
                imagefill($target, 0, 0, $white);
                imagecopyresampled(
                    $target,
                    $source,
                    0,
                    0,
                    0,
                    0,
                    $targetWidth,
                    $targetHeight,
                    $width,
                    $height,
                );

                $directory = dirname($destinationPath);
                if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
                    throw new \RuntimeException("Unable to create PDF image directory: {$directory}");
                }

                $temporaryPath = $destinationPath.'.'.bin2hex(random_bytes(6)).'.tmp';
                if (! imagejpeg($target, $temporaryPath, (int) config('pdf.images.jpeg_quality', 80))) {
                    throw new \RuntimeException('Unable to encode the optimized JPEG.');
                }

                if (! rename($temporaryPath, $destinationPath)) {
                    @unlink($temporaryPath);
                    throw new \RuntimeException('Unable to atomically store the optimized JPEG.');
                }
            } finally {
                imagedestroy($target);
            }
        } finally {
            imagedestroy($source);
        }
    }

    private function deleteDerivativesExcept(string $sourcePath, string $keepPath): void
    {
        $disk = Storage::disk('public');
        $directory = trim((string) config('pdf.images.directory', 'work-reports/pdf'), '/');
        $sourceDirectory = $directory.'/'.sha1($sourcePath);

        foreach ($disk->files($sourceDirectory) as $path) {
            if ($path !== $keepPath) {
                $disk->delete($path);
            }
        }
    }
}
