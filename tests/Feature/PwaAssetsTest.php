<?php

namespace Tests\Feature;

use Tests\TestCase;

class PwaAssetsTest extends TestCase
{
    public function test_manifest_is_accessible_and_valid(): void
    {
        $response = $this->get('/manifest.webmanifest');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/manifest+json');

        $data = json_decode($response->getContent(), true);
        $this->assertIsArray($data);
        $this->assertEquals('ManPro - Manajemen Proyek & Operasional', $data['name']);
        $this->assertEquals('ManPro', $data['short_name']);
        $this->assertEquals('standalone', $data['display']);
        $this->assertNotEmpty($data['icons']);
        $this->assertNotEmpty($data['shortcuts']);
    }

    public function test_manifest_alias_json_is_accessible(): void
    {
        $response = $this->get('/manifest.json');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/manifest+json');

        $data = json_decode($response->getContent(), true);
        $this->assertIsArray($data);
        $this->assertEquals('ManPro', $data['short_name']);
    }

    public function test_service_worker_is_accessible(): void
    {
        $response = $this->get('/sw.js');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/javascript');
        $this->assertStringContainsString('manpro-core', $response->getContent());
        $this->assertStringContainsString('/offline.html', $response->getContent());
    }

    public function test_offline_page_is_accessible(): void
    {
        $response = $this->get('/offline.html');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/html', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Mode Offline', $response->getContent());
        $this->assertStringContainsString('Koneksi Terputus', $response->getContent());
    }

    public function test_pwa_icons_exist_in_public(): void
    {
        $this->assertFileExists(public_path('icons/app_icon.png'));
        $this->assertFileExists(public_path('icons/icon-48.png'));
        $this->assertFileExists(public_path('icons/icon-192.png'));
        $this->assertFileExists(public_path('icons/icon-512.png'));
        $this->assertFileExists(public_path('icons/icon-maskable-512.png'));
        $this->assertFileExists(public_path('icons/apple-touch-icon.png'));
        $this->assertFileExists(public_path('icons/icon.svg'));
        $this->assertFileExists(public_path('favicon.ico'));
    }
}
