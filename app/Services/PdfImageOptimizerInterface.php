<?php

namespace App\Services;

interface PdfImageOptimizerInterface
{
    /**
     * Return an absolute path suitable for Dompdf.
     */
    public function optimize(string $sourcePath): string;

    /**
     * Remove all PDF derivatives belonging to a source image.
     */
    public function deleteDerivatives(string $sourcePath): void;
}
