<?php

namespace Tests\Unit;

use App\Models\Bap;
use App\Models\Client;
use App\Services\BapNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BapNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private BapNumberGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new BapNumberGenerator();
    }

    public function test_generates_first_number_of_year(): void
    {
        $date = new \DateTime('2024-03-15');
        $result = $this->generator->generate($date);

        $this->assertEquals('BAP/0001/03/2024', $result);
    }

    public function test_increments_number_within_same_year(): void
    {
        $client = Client::factory()->create();

        Bap::factory()->create([
            'nomor_surat' => 'BAP/0001/01/2024',
            'client_id' => $client->id,
            'tanggal' => '2024-01-10',
        ]);

        $date = new \DateTime('2024-03-15');
        $result = $this->generator->generate($date);

        $this->assertEquals('BAP/0002/03/2024', $result);
    }

    public function test_increments_from_highest_number(): void
    {
        $client = Client::factory()->create();

        Bap::factory()->create([
            'nomor_surat' => 'BAP/0001/01/2024',
            'client_id' => $client->id,
            'tanggal' => '2024-01-10',
        ]);

        Bap::factory()->create([
            'nomor_surat' => 'BAP/0005/02/2024',
            'client_id' => $client->id,
            'tanggal' => '2024-02-20',
        ]);

        $date = new \DateTime('2024-04-01');
        $result = $this->generator->generate($date);

        $this->assertEquals('BAP/0006/04/2024', $result);
    }

    public function test_resets_number_for_new_year(): void
    {
        $client = Client::factory()->create();

        Bap::factory()->create([
            'nomor_surat' => 'BAP/0010/12/2023',
            'client_id' => $client->id,
            'tanggal' => '2023-12-15',
        ]);

        $date = new \DateTime('2024-01-05');
        $result = $this->generator->generate($date);

        $this->assertEquals('BAP/0001/01/2024', $result);
    }

    public function test_format_matches_bap_xxxx_mm_yyyy(): void
    {
        $date = new \DateTime('2025-07-22');
        $result = $this->generator->generate($date);

        $this->assertMatchesRegularExpression('/^BAP\/\d{4}\/\d{2}\/\d{4}$/', $result);
    }

    public function test_uses_month_from_date_parameter(): void
    {
        $date = new \DateTime('2024-11-01');
        $result = $this->generator->generate($date);

        $this->assertEquals('BAP/0001/11/2024', $result);
    }

    public function test_handles_large_sequence_numbers(): void
    {
        $client = Client::factory()->create();

        Bap::factory()->create([
            'nomor_surat' => 'BAP/0999/06/2024',
            'client_id' => $client->id,
            'tanggal' => '2024-06-01',
        ]);

        $date = new \DateTime('2024-07-15');
        $result = $this->generator->generate($date);

        $this->assertEquals('BAP/1000/07/2024', $result);
    }

    public function test_can_be_resolved_from_container(): void
    {
        $generator = app(\App\Services\BapNumberGeneratorInterface::class);

        $this->assertInstanceOf(BapNumberGenerator::class, $generator);
    }
}
