<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Generated PDF cache
    |--------------------------------------------------------------------------
    |
    | Increment the version whenever a deployed PDF template changes. Cached
    | files are private and are never exposed through the public filesystem.
    |
    */
    'cache_enabled' => env('PDF_CACHE_ENABLED', true),
    'cache_path' => 'generated-pdfs',
    'cache_version' => env('PDF_CACHE_VERSION', '1'),
    'lock_seconds' => 180,
    'lock_wait_seconds' => 30,

    /*
    |--------------------------------------------------------------------------
    | PDF image derivatives
    |--------------------------------------------------------------------------
    */
    'images' => [
        'enabled' => env('PDF_IMAGE_OPTIMIZATION_ENABLED', true),
        'directory' => 'work-reports/pdf',
        'max_dimension' => env('PDF_IMAGE_MAX_DIMENSION', 1024),
        'jpeg_quality' => env('PDF_IMAGE_JPEG_QUALITY', 55),
    ],
    'upload_images' => [
        'max_dimension' => env('WORK_REPORT_IMAGE_MAX_DIMENSION', 1024),
        'jpeg_quality' => env('WORK_REPORT_IMAGE_JPEG_QUALITY', 55),
    ],
];
