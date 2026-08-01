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
        $entries = array_map(fn ($entry) => $this->normalizeEntry($entry), $entries);
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
     * Normalize legacy temperature fields and infer the Ampere input count.
     */
    private function normalizeEntry(mixed $entry): mixed
    {
        if (! is_array($entry)) {
            return $entry;
        }

        foreach (['before', 'after'] as $timing) {
            $newKey = "suhu_{$timing}";
            if (! array_key_exists($newKey, $entry)) {
                foreach (['r', 's', 't'] as $phase) {
                    $legacyKey = "{$newKey}_{$phase}";
                    if (array_key_exists($legacyKey, $entry) && $entry[$legacyKey] !== '' && $entry[$legacyKey] !== null) {
                        $entry[$newKey] = $entry[$legacyKey];
                        break;
                    }
                }
                $entry[$newKey] ??= null;
            }
        }

        if (! array_key_exists('ampere_input_count', $entry) || $entry['ampere_input_count'] === null || $entry['ampere_input_count'] === '') {
            $entry['ampere_input_count'] = 1;
            foreach (['t' => 3, 's' => 2, 'r' => 1] as $phase => $count) {
                if (($entry["ampere_before_{$phase}"] ?? null) !== null && ($entry["ampere_before_{$phase}"] ?? '') !== ''
                    || ($entry["ampere_after_{$phase}"] ?? null) !== null && ($entry["ampere_after_{$phase}"] ?? '') !== '') {
                    $entry['ampere_input_count'] = $count;
                    break;
                }
            }
        } else {
            $entry['ampere_input_count'] = (int) $entry['ampere_input_count'];
        }

        if ($entry['ampere_input_count'] >= 1 && $entry['ampere_input_count'] < 3) {
            $entry['ampere_before_t'] = null;
            $entry['ampere_after_t'] = null;
        }
        if ($entry['ampere_input_count'] >= 1 && $entry['ampere_input_count'] < 2) {
            $entry['ampere_before_s'] = null;
            $entry['ampere_after_s'] = null;
        }

        return $entry;
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

            // Suhu fields (one value each for before and after)
            foreach (['before', 'after'] as $timing) {
                $rules["{$prefix}.suhu_{$timing}"] = ['nullable', 'numeric', 'between:-10,100'];
            }

            // Ampere fields (before/after × selected R/S/T inputs)
            $rules["{$prefix}.ampere_input_count"] = ['required', 'integer', 'in:1,2,3'];
            foreach (['before', 'after'] as $timing) {
                foreach (['r', 's', 't'] as $phase) {
                    $rules["{$prefix}.ampere_{$timing}_{$phase}"] = ['nullable', 'numeric', 'between:0,200'];
                }
            }

            // Freon fields (2 total: before/after)
            $rules["{$prefix}.freon_before"] = ['nullable', 'numeric', 'between:0,800'];
            $rules["{$prefix}.freon_after"] = ['nullable', 'numeric', 'between:0,800'];

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
            'entries.*.suhu_before.between' => 'Suhu before harus antara -10 dan 100°C',
            'entries.*.suhu_after.between' => 'Suhu after harus antara -10 dan 100°C',
            'entries.*.ampere_input_count.required' => 'Jumlah input Ampere wajib dipilih',
            'entries.*.ampere_input_count.in' => 'Jumlah input Ampere harus antara 1 dan 3',
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
            'entries.*.freon_before.between' => 'Tekanan freon before harus antara 0 dan 800 PSI',
            'entries.*.freon_after.between' => 'Tekanan freon after harus antara 0 dan 800 PSI',
            'entries.*.keterangan.max' => 'Keterangan maksimal 1000 karakter',
        ];
    }
}
