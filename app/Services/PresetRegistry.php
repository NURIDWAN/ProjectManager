<?php

namespace App\Services;

class PresetRegistry implements PresetRegistryInterface
{
    /**
     * Registered preset configurations keyed by identifier.
     *
     * @var array<string, array>
     */
    protected array $presets;

    public function __construct()
    {
        $this->presets = [
            'ac_maintenance' => [
                'identifier' => 'ac_maintenance',
                'label' => 'AC Maintenance',
                'fields' => [
                    'lokasi' => ['type' => 'text', 'max' => 255, 'required' => true],
                    'tipe_ac' => ['type' => 'select', 'options' => ['Splitduct', 'Cassette', 'Splitwall'], 'required' => true],
                    'merek' => ['type' => 'text_or_select', 'options' => ['Panasonic', 'Gree', 'Daikin'], 'max' => 100, 'required' => true],
                    'kapasitas' => ['type' => 'numeric', 'min' => 0.5, 'max' => 30, 'unit' => 'PK', 'required' => true],
                    'suhu_before_r' => ['type' => 'numeric', 'min' => -10, 'max' => 100, 'unit' => '°C', 'required' => false],
                    'suhu_before_s' => ['type' => 'numeric', 'min' => -10, 'max' => 100, 'unit' => '°C', 'required' => false],
                    'suhu_before_t' => ['type' => 'numeric', 'min' => -10, 'max' => 100, 'unit' => '°C', 'required' => false],
                    'suhu_after_r' => ['type' => 'numeric', 'min' => -10, 'max' => 100, 'unit' => '°C', 'required' => false],
                    'suhu_after_s' => ['type' => 'numeric', 'min' => -10, 'max' => 100, 'unit' => '°C', 'required' => false],
                    'suhu_after_t' => ['type' => 'numeric', 'min' => -10, 'max' => 100, 'unit' => '°C', 'required' => false],
                    'ampere_before_r' => ['type' => 'numeric', 'min' => 0, 'max' => 200, 'unit' => 'A', 'required' => false],
                    'ampere_before_s' => ['type' => 'numeric', 'min' => 0, 'max' => 200, 'unit' => 'A', 'required' => false],
                    'ampere_before_t' => ['type' => 'numeric', 'min' => 0, 'max' => 200, 'unit' => 'A', 'required' => false],
                    'ampere_after_r' => ['type' => 'numeric', 'min' => 0, 'max' => 200, 'unit' => 'A', 'required' => false],
                    'ampere_after_s' => ['type' => 'numeric', 'min' => 0, 'max' => 200, 'unit' => 'A', 'required' => false],
                    'ampere_after_t' => ['type' => 'numeric', 'min' => 0, 'max' => 200, 'unit' => 'A', 'required' => false],
                    'freon_before' => ['type' => 'numeric', 'min' => 0, 'max' => 800, 'unit' => 'PSI', 'required' => true],
                    'freon_after' => ['type' => 'numeric', 'min' => 0, 'max' => 800, 'unit' => 'PSI', 'required' => true],
                    'keterangan' => ['type' => 'text', 'max' => 1000, 'required' => false],
                ],
                'min_entries' => 1,
                'max_entries' => 50,
            ],
        ];
    }

    /**
     * Check if a preset identifier exists.
     */
    public function has(string $identifier): bool
    {
        return isset($this->presets[$identifier]);
    }

    /**
     * Get the preset configuration for a given identifier.
     * Returns null if not found.
     */
    public function get(string $identifier): ?array
    {
        return $this->presets[$identifier] ?? null;
    }

    /**
     * Get all registered preset identifiers.
     */
    public function all(): array
    {
        return array_keys($this->presets);
    }
}
