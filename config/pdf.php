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
        'max_dimension' => 1600,
        'jpeg_quality' => 80,
    ],
];
