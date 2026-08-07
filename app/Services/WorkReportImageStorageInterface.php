<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

interface WorkReportImageStorageInterface
{
    public function storeCompressed(UploadedFile $file, string $directory): string;
}
