<?php

namespace App\Services;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AcMeasurementValidator implements AcMeasurementValidatorInterface
{
    /**
     * Minimum number of entries allowed.
     */
    private const MIN_ENTRIES = 1;

    /**
     * Maximum number of entries allowed.
     */
    private const MAX_ENTRIES = 50;

    /**
     * Validate an array of AC measurement entries.
     * Returns validated data on success, throws ValidationException on failure.
     *
     * @param array $entries Array of AC measurement entry arrays
     * @return array Validated and sanitized entries
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validate(array $entries): array
    {
        $this->validateEntryCount($entries);

        $validator = Validator::make(
            ['entries' => $entries],
            $this->buildRules($entries),
            $this->buildMessages()
        );

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated()['entries'];
    }

    /**
     * Validate that the entry count is within allowed bounds.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    private function validateEntryCount(array $entries): void
    {
        $count = count($entries);

        if ($count < self::MIN_ENTRIES) {
            $validator = Validator::make([], []);
            $validator->errors()->add('entries', 'Minimal 1 unit AC harus diisi');
            throw new ValidationException($validator);
        }

        if ($count > self::MAX_ENTRIES) {
            $validator = Validator::make([], []);
            $validator->errors()->add('entries', 'Maksimal 50 unit AC per laporan');
            throw new ValidationException($validator);
        }
    }

    /**
     * Build validation rules for all entries.
     */
    private function buildRules(array $entries): array
    {
        $rules = [
            'entries' => ['required', 'array', 'min:' . self::MIN_ENTRIES, 'max:' . self::MAX_ENTRIES],
        ];

        foreach ($entries as $index => $entry) {
            $prefix = "entries.{$index}";

            // Unit identification fields
            $rules["{$prefix}.lokasi"] = ['required', 'string', 'max:255'];
            $rules["{$prefix}.tipe_ac"] = ['required', 'string', 'in:Splitduct,Cassette,Splitwall'];
            $rules["{$prefix}.merek"] = ['required', 'string', 'max:100'];
            $rules["{$prefix}.kapasitas"] = ['required', 'numeric', 'between:0.5,30'];

            // Suhu fields (6 total: before/after × R/S/T) - R/S/T are optional
            foreach (['before', 'after'] as $timing) {
                foreach (['r', 's', 't'] as $phase) {
                    $rules["{$prefix}.suhu_{$timing}_{$phase}"] = ['nullable', 'numeric', 'between:-10,100'];
                }
            }

            // Ampere fields (6 total: before/after × R/S/T) - R/S/T are optional
            foreach (['before', 'after'] as $timing) {
                foreach (['r', 's', 't'] as $phase) {
                    $rules["{$prefix}.ampere_{$timing}_{$phase}"] = ['nullable', 'numeric', 'between:0,200'];
                }
            }

            // Freon fields (2 total: before/after)
            $rules["{$prefix}.freon_before"] = ['required', 'numeric', 'between:0,800'];
            $rules["{$prefix}.freon_after"] = ['required', 'numeric', 'between:0,800'];

            // Keterangan (optional)
            $rules["{$prefix}.keterangan"] = ['nullable', 'string', 'max:1000'];
        }

        return $rules;
    }

    /**
     * Build custom validation messages.
     */
    private function buildMessages(): array
    {
        return [
            'entries.min' => 'Minimal 1 unit AC harus diisi',
            'entries.max' => 'Maksimal 50 unit AC per laporan',
            'entries.*.lokasi.required' => 'Lokasi unit AC wajib diisi',
            'entries.*.lokasi.max' => 'Lokasi maksimal 255 karakter',
            'entries.*.tipe_ac.required' => 'Tipe AC wajib dipilih',
            'entries.*.tipe_ac.in' => 'Tipe AC harus salah satu dari: Splitduct, Cassette, Splitwall',
            'entries.*.merek.required' => 'Merek AC wajib diisi',
            'entries.*.merek.max' => 'Merek maksimal 100 karakter',
            'entries.*.kapasitas.required' => 'Kapasitas wajib diisi',
            'entries.*.kapasitas.between' => 'Kapasitas harus antara 0.5 dan 30 PK',
            'entries.*.suhu_before_r.required' => 'Suhu before R wajib diisi',
            'entries.*.suhu_before_r.between' => 'Suhu before R harus antara -10 dan 100°C',
            'entries.*.suhu_before_s.required' => 'Suhu before S wajib diisi',
            'entries.*.suhu_before_s.between' => 'Suhu before S harus antara -10 dan 100°C',
            'entries.*.suhu_before_t.required' => 'Suhu before T wajib diisi',
            'entries.*.suhu_before_t.between' => 'Suhu before T harus antara -10 dan 100°C',
            'entries.*.suhu_after_r.required' => 'Suhu after R wajib diisi',
            'entries.*.suhu_after_r.between' => 'Suhu after R harus antara -10 dan 100°C',
            'entries.*.suhu_after_s.required' => 'Suhu after S wajib diisi',
            'entries.*.suhu_after_s.between' => 'Suhu after S harus antara -10 dan 100°C',
            'entries.*.suhu_after_t.required' => 'Suhu after T wajib diisi',
            'entries.*.suhu_after_t.between' => 'Suhu after T harus antara -10 dan 100°C',
            'entries.*.ampere_before_r.required' => 'Ampere before R wajib diisi',
            'entries.*.ampere_before_r.between' => 'Ampere before R harus antara 0 dan 200A',
            'entries.*.ampere_before_s.required' => 'Ampere before S wajib diisi',
            'entries.*.ampere_before_s.between' => 'Ampere before S harus antara 0 dan 200A',
            'entries.*.ampere_before_t.required' => 'Ampere before T wajib diisi',
            'entries.*.ampere_before_t.between' => 'Ampere before T harus antara 0 dan 200A',
            'entries.*.ampere_after_r.required' => 'Ampere after R wajib diisi',
            'entries.*.ampere_after_r.between' => 'Ampere after R harus antara 0 dan 200A',
            'entries.*.ampere_after_s.required' => 'Ampere after S wajib diisi',
            'entries.*.ampere_after_s.between' => 'Ampere after S harus antara 0 dan 200A',
            'entries.*.ampere_after_t.required' => 'Ampere after T wajib diisi',
            'entries.*.ampere_after_t.between' => 'Ampere after T harus antara 0 dan 200A',
            'entries.*.freon_before.required' => 'Tekanan freon before wajib diisi',
            'entries.*.freon_before.between' => 'Tekanan freon before harus antara 0 dan 800 PSI',
            'entries.*.freon_after.required' => 'Tekanan freon after wajib diisi',
            'entries.*.freon_after.between' => 'Tekanan freon after harus antara 0 dan 800 PSI',
            'entries.*.keterangan.max' => 'Keterangan maksimal 1000 karakter',
        ];
    }
}
