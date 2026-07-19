<?php

namespace App\Services;

interface PresetRegistryInterface
{
    /**
     * Check if a preset identifier exists.
     */
    public function has(string $identifier): bool;

    /**
     * Get the preset configuration for a given identifier.
     * Returns null if not found.
     */
    public function get(string $identifier): ?array;

    /**
     * Get all registered preset identifiers.
     */
    public function all(): array;
}
