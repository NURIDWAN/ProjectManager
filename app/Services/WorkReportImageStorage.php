<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WorkReportImageStorage implements WorkReportImageStorageInterface
{
    public function storeCompressed(UploadedFile $file, string $directory): string
    {
        if (! extension_loaded('gd')) {
            return $file->store($directory, 'public');
        }

        $contents = file_get_contents($file->getRealPath());
        $source = $contents === false ? false : imagecreatefromstring($contents);
        if ($source === false) {
            throw new \RuntimeException('Foto tidak dapat diproses.');
        }

        try {
            $source = $this->applyExifOrientation($source, $file);
            $width = imagesx($source);
            $height = imagesy($source);
            $maxDimension = max(1, (int) config('pdf.upload_images.max_dimension', 1024));
            $scale = min(1, $maxDimension / max($width, $height));
            $targetWidth = max(1, (int) round($width * $scale));
            $targetHeight = max(1, (int) round($height * $scale));
            $target = imagecreatetruecolor($targetWidth, $targetHeight);
            if ($target === false) {
                throw new \RuntimeException('Foto tidak dapat dialokasikan untuk kompresi.');
            }

            try {
                $white = imagecolorallocate($target, 255, 255, 255);
                imagefill($target, 0, 0, $white);
                imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

                $path = trim($directory, '/').'/compressed/'.Str::random(40).'.jpg';
                $absolutePath = Storage::disk('public')->path($path);
                $absoluteDirectory = dirname($absolutePath);
                if (! is_dir($absoluteDirectory) && ! mkdir($absoluteDirectory, 0755, true) && ! is_dir($absoluteDirectory)) {
                    throw new \RuntimeException('Folder penyimpanan foto tidak dapat dibuat.');
                }

                $temporaryPath = $absolutePath.'.'.bin2hex(random_bytes(6)).'.tmp';
                if (! imagejpeg($target, $temporaryPath, (int) config('pdf.upload_images.jpeg_quality', 55))) {
                    throw new \RuntimeException('Foto tidak dapat dikompres ke JPEG.');
                }
                if (! rename($temporaryPath, $absolutePath)) {
                    @unlink($temporaryPath);
                    throw new \RuntimeException('Foto terkompresi tidak dapat disimpan.');
                }

                return $path;
            } finally {
                imagedestroy($target);
            }
        } finally {
            imagedestroy($source);
        }
    }

    private function applyExifOrientation(\GdImage $source, UploadedFile $file): \GdImage
    {
        if (! function_exists('exif_read_data') || ! in_array($file->getMimeType(), ['image/jpeg', 'image/jpg'], true)) {
            return $source;
        }

        $exif = @exif_read_data($file->getRealPath());
        $angle = match ((int) ($exif['Orientation'] ?? 1)) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };
        if ($angle === 0) {
            return $source;
        }

        $rotated = imagerotate($source, $angle, 0);
        if ($rotated === false) {
            return $source;
        }

        imagedestroy($source);
        return $rotated;
    }
}
