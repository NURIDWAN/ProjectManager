<?php

namespace App\Services;

interface AcMeasurementValidatorInterface
{
    /**
     * Validate an array of AC measurement entries.
     * Returns validated data on success, throws ValidationException on failure.
     *
     * @param array $entries Array of AC measurement entry arrays
     * @return array Validated and sanitized entries
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validate(array $entries): array;

    /**
     * Lenient validation for autosave: unit identification fields (lokasi,
     * tipe_ac, merek, kapasitas) may be empty while the user is still typing,
     * but any value that IS provided must still be well-formed.
     * Returns sanitized entries on success.
     *
     * @param array $entries Array of AC measurement entry arrays
     * @return array Sanitized entries
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validatePartial(array $entries): array;
}
