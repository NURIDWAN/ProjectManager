{{-- Surat BAST Page - Partial template (no full HTML document) --}}
{{-- Variables: $bast, $client, $workItems, $settings --}}

@php
    $bulanIndonesia = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];
    $tanggal = $bast->tanggal;
    $tanggalFormatted = 'Jakarta, ' . $tanggal->format('d') . ' ' . $bulanIndonesia[(int)$tanggal->format('m')] . ' ' . $tanggal->format('Y');
@endphp

{{-- Company Header --}}
<div style="margin-bottom: 20px;">
    <table style="width: 100%; border: none;">
        <tr>
            <td style="width: 120px; vertical-align: middle; text-align: center; border: none; padding: 0;">
                @if(!empty($settings['company_logo']))
                    <img src="{{ storage_path('app/public/' . $settings['company_logo']) }}" style="max-height: 60px; max-width: 110px;" alt="Logo">
                @endif
            </td>
            <td style="vertical-align: middle; text-align: left; border: none; padding-left: 10px;">
                <h1 style="margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">{{ strtoupper($settings['company_name'] ?? 'Dokumen Resmi') }}</h1>
                <p style="margin: 2px 0; font-size: 10px;">{{ $settings['company_address'] ?? '' }}</p>
                @if(!empty($settings['company_address_2']))
                    <p style="margin: 2px 0; font-size: 10px;">{{ $settings['company_address_2'] }}</p>
                @endif
            </td>
        </tr>
    </table>
    <div style="margin-top: 8px; border-top: 3px solid #0099cc; border-bottom: 1px solid #0099cc; height: 6px;"></div>
</div>

{{-- Document Title --}}
<div style="text-align: center; margin-bottom: 15px;">
    <h2 style="font-size: 14px; font-weight: bold; margin: 0; text-decoration: underline;">BERITA ACARA PENYELESAIAN PEKERJAAN</h2>
</div>

{{-- Document Number and Date --}}
<div style="margin-bottom: 15px;">
    <table style="width: 100%; border: none;">
        <tr>
            <td style="border: none; padding: 2px 0; width: 100px; font-size: 11px;">Nomor</td>
            <td style="border: none; padding: 2px 0; width: 15px; font-size: 11px;">:</td>
            <td style="border: none; padding: 2px 0; font-size: 11px; font-weight: bold;">{{ $bast->document_number }}</td>
        </tr>
        <tr>
            <td style="border: none; padding: 2px 0; font-size: 11px;">Tanggal</td>
            <td style="border: none; padding: 2px 0; font-size: 11px;">:</td>
            <td style="border: none; padding: 2px 0; font-size: 11px;">{{ $tanggalFormatted }}</td>
        </tr>
    </table>
</div>

{{-- Opening Paragraph --}}
<div style="margin-bottom: 15px; text-align: justify; font-size: 11px; line-height: 1.6;">
    <p>Yang bertanda tangan di bawah ini:</p>
</div>

{{-- Pihak Pertama Section --}}
<div style="margin-bottom: 12px; font-size: 11px; line-height: 1.6;">
    <table style="width: 100%; border: none;">
        <tr>
            <td style="border: none; padding: 2px 0; width: 30px; vertical-align: top;">I.</td>
            <td style="border: none; padding: 2px 0;">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="border: none; padding: 2px 0; width: 120px;">Nama</td>
                        <td style="border: none; padding: 2px 0; width: 15px;">:</td>
                        <td style="border: none; padding: 2px 0; font-weight: bold;">{{ $client->name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 2px 0;">Alamat</td>
                        <td style="border: none; padding: 2px 0;">:</td>
                        <td style="border: none; padding: 2px 0;">{{ $client->address ?? '-' }}</td>
                    </tr>
                </table>
                <p style="margin-top: 4px;">Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong></p>
            </td>
        </tr>
    </table>
</div>

{{-- Pihak Kedua Section --}}
<div style="margin-bottom: 15px; font-size: 11px; line-height: 1.6;">
    <table style="width: 100%; border: none;">
        <tr>
            <td style="border: none; padding: 2px 0; width: 30px; vertical-align: top;">II.</td>
            <td style="border: none; padding: 2px 0;">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="border: none; padding: 2px 0; width: 120px;">Nama</td>
                        <td style="border: none; padding: 2px 0; width: 15px;">:</td>
                        <td style="border: none; padding: 2px 0; font-weight: bold;">{{ $settings['company_name'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 2px 0;">Alamat</td>
                        <td style="border: none; padding: 2px 0;">:</td>
                        <td style="border: none; padding: 2px 0;">{{ $settings['company_address'] ?? '-' }}{{ !empty($settings['company_address_2']) ? ', ' . $settings['company_address_2'] : '' }}</td>
                    </tr>
                </table>
                <p style="margin-top: 4px;">Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong></p>
            </td>
        </tr>
    </table>
</div>

{{-- Description Paragraph --}}
<div style="margin-bottom: 15px; text-align: justify; font-size: 11px; line-height: 1.6;">
    <p>Pada hari ini, {{ $bulanIndonesia[(int)$tanggal->format('m')] }} {{ $tanggal->format('d') }}, {{ $tanggal->format('Y') }}, Pihak Kedua telah menyelesaikan pekerjaan sesuai dengan lingkup pekerjaan yang telah disepakati dengan rincian sebagai berikut:</p>
</div>

{{-- Work Items Table --}}
<div style="margin-bottom: 15px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
            <tr>
                <th style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 30px;">No</th>
                <th style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; background-color: #f0f0f0;">Uraian Pekerjaan / Service Plan</th>
                <th style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 60px;">Satuan</th>
                <th style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50px;">Jumlah</th>
                <th style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 90px;">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @if(count($workItems) > 0)
                @foreach($workItems as $item)
                <tr>
                    <td style="border: 1px solid #333; padding: 5px 4px; text-align: center;">{{ $item['no'] }}</td>
                    <td style="border: 1px solid #333; padding: 5px 8px;">{{ $item['uraian_pekerjaan'] }}</td>
                    <td style="border: 1px solid #333; padding: 5px 4px; text-align: center;">{{ $item['satuan'] }}</td>
                    <td style="border: 1px solid #333; padding: 5px 4px; text-align: center;">{{ $item['jumlah'] }}</td>
                    <td style="border: 1px solid #333; padding: 5px 4px; text-align: center;">{{ $item['keterangan'] ?? '' }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="5" style="border: 1px solid #333; padding: 10px; text-align: center; font-style: italic; color: #666;">Tidak ada uraian pekerjaan.</td>
                </tr>
            @endif
        </tbody>
    </table>
</div>

{{-- Closing Paragraph --}}
<div style="margin-bottom: 20px; text-align: justify; font-size: 11px; line-height: 1.6;">
    <p>Demikian Berita Acara Penyelesaian Pekerjaan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
</div>

{{-- Signature Area --}}
<table style="width: 100%; border: none; page-break-inside: avoid; margin-top: 30px;">
    {{-- Header Row: Pihak Kedua (left) and Pihak Pertama (right) --}}
    <tr>
        <td style="width: 50%; vertical-align: top; border: none; padding: 0 10px;">
            <p style="font-size: 11px; margin: 0;"><strong><u>Pihak Kedua</u></strong></p>
            <p style="font-size: 11px; margin: 2px 0 0 0; font-weight: bold;">{{ $settings['company_name'] ?? 'PT. Vida Sinergi Service Indonesia' }}</p>
        </td>
        <td style="width: 50%; vertical-align: top; border: none; padding: 0 10px;">
            <p style="font-size: 11px; margin: 0;"><strong><u>Pihak Pertama</u></strong></p>
            <p style="font-size: 11px; margin: 2px 0 0 0; font-weight: bold;">{{ $client->name ?? '-' }}</p>
        </td>
    </tr>
    {{-- Spacer --}}
    <tr><td colspan="2" style="border: none; height: 30px;"></td></tr>
    {{-- Signature Row 1 --}}
    <tr>
        <td style="width: 50%; vertical-align: top; border: none; padding: 5px 10px;">
            <p style="font-size: 11px; margin: 0;">Project Coordinator &nbsp;: &nbsp;(……………………..)</p>
        </td>
        <td style="width: 50%; vertical-align: top; border: none; padding: 5px 10px;">
            <p style="font-size: 11px; margin: 0;">Maintenance Manager &nbsp;&nbsp;: (……………………..)</p>
        </td>
    </tr>
    {{-- Spacer --}}
    <tr><td colspan="2" style="border: none; height: 30px;"></td></tr>
    {{-- Signature Row 2 --}}
    <tr>
        <td style="width: 50%; vertical-align: top; border: none; padding: 5px 10px;">
            <p style="font-size: 11px; margin: 0;">Operational Manager : &nbsp;(……………………..)</p>
        </td>
        <td style="width: 50%; vertical-align: top; border: none; padding: 5px 10px;">
            <p style="font-size: 11px; margin: 0;">Chief Engineering &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: (……………………..)</p>
        </td>
    </tr>
</table>
