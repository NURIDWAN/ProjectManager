<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Bast;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PdfEndpointTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->client = Client::factory()->create();
    }

    public function test_bap_preview_and_download_return_valid_pdf_with_distinct_dispositions(): void
    {
        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'work_report_ids' => [],
        ]);

        $this->assertPdfResponses("/baps/{$bap->id}");
    }

    public function test_invoice_preview_and_download_return_valid_pdf_with_distinct_dispositions(): void
    {
        $invoice = Invoice::factory()->create([
            'client_id' => $this->client->id,
            'bap_id' => null,
        ]);

        $this->assertPdfResponses("/invoices/{$invoice->id}");
    }

    public function test_bast_preview_and_download_return_valid_pdf_with_distinct_dispositions(): void
    {
        $bast = Bast::create([
            'bap_id' => null,
            'document_number' => 'BAST/0001/01/2024',
            'tanggal' => '2024-01-15',
            'client_id' => $this->client->id,
            'work_items' => [],
        ]);

        $this->assertPdfResponses("/basts/{$bast->id}");
    }

    private function assertPdfResponses(string $baseUrl): void
    {
        $preview = $this->actingAs($this->admin)
            ->get($baseUrl . '/pdf-preview', [
                'Accept' => 'application/pdf',
                'X-Requested-With' => 'XMLHttpRequest',
            ]);

        $preview->assertOk();
        $preview->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('inline;', $preview->headers->get('content-disposition', ''));
        $this->assertStringStartsWith('%PDF-', $preview->getContent());

        $download = $this->actingAs($this->admin)->get($baseUrl . '/export-pdf');

        $download->assertOk();
        $download->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('attachment;', $download->headers->get('content-disposition', ''));
        $this->assertStringStartsWith('%PDF-', $download->getContent());
    }
}
