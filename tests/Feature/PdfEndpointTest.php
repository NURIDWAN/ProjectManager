<?php

namespace Tests\Feature;

use App\Models\Bap;
use App\Models\Bast;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
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

    public function test_bap_pdf_cache_is_reused_and_invalidated_when_source_data_changes(): void
    {
        Storage::fake('local');
        $bap = Bap::factory()->create([
            'client_id' => $this->client->id,
            'work_report_ids' => [],
        ]);
        $cacheDirectory = "generated-pdfs/bap/{$bap->id}";

        $first = $this->actingAs($this->admin)->get("/baps/{$bap->id}/pdf-preview");
        $first->assertOk();
        $firstFiles = Storage::disk('local')->files($cacheDirectory);

        $second = $this->actingAs($this->admin)->get("/baps/{$bap->id}/export-pdf");

        $second->assertOk();
        $this->assertSame($first->getContent(), $second->getContent());
        $this->assertSame($firstFiles, Storage::disk('local')->files($cacheDirectory));
        $this->assertCount(1, $firstFiles);

        $bap->update(['signed_by' => 'Penanda tangan baru']);
        $third = $this->actingAs($this->admin)->get("/baps/{$bap->id}/pdf-preview");
        $thirdFiles = Storage::disk('local')->files($cacheDirectory);

        $third->assertOk();
        $this->assertCount(1, $thirdFiles);
        $this->assertNotSame($firstFiles[0], $thirdFiles[0]);
    }

    public function test_bast_pdf_cache_is_reused_and_invalidated_when_source_data_changes(): void
    {
        Storage::fake('local');
        $bast = Bast::create([
            'bap_id' => null,
            'document_number' => 'BAST/CACHE/01/2024',
            'tanggal' => '2024-01-15',
            'client_id' => $this->client->id,
            'work_items' => [],
        ]);
        $cacheDirectory = "generated-pdfs/bast/{$bast->id}";

        $first = $this->actingAs($this->admin)->get("/basts/{$bast->id}/pdf-preview");
        $firstFiles = Storage::disk('local')->files($cacheDirectory);
        $second = $this->actingAs($this->admin)->get("/basts/{$bast->id}/export-pdf");

        $first->assertOk();
        $second->assertOk();
        $this->assertSame($first->getContent(), $second->getContent());
        $this->assertCount(1, $firstFiles);
        $this->assertSame($firstFiles, Storage::disk('local')->files($cacheDirectory));

        $bast->update(['work_items' => [[
            'no' => 1,
            'uraian_pekerjaan' => 'Pekerjaan baru',
            'satuan' => 'unit',
            'jumlah' => 1,
            'keterangan' => null,
        ]]]);
        $third = $this->actingAs($this->admin)->get("/basts/{$bast->id}/pdf-preview");
        $thirdFiles = Storage::disk('local')->files($cacheDirectory);

        $third->assertOk();
        $this->assertCount(1, $thirdFiles);
        $this->assertNotSame($firstFiles[0], $thirdFiles[0]);
    }

    private function assertPdfResponses(string $baseUrl): void
    {
        $preview = $this->actingAs($this->admin)
            ->get($baseUrl.'/pdf-preview', [
                'Accept' => 'application/pdf',
                'X-Requested-With' => 'XMLHttpRequest',
            ]);

        $preview->assertOk();
        $preview->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('inline;', $preview->headers->get('content-disposition', ''));
        $this->assertStringStartsWith('%PDF-', $preview->getContent());

        $download = $this->actingAs($this->admin)->get($baseUrl.'/export-pdf');

        $download->assertOk();
        $download->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('attachment;', $download->headers->get('content-disposition', ''));
        $this->assertStringStartsWith('%PDF-', $download->getContent());
    }
}
