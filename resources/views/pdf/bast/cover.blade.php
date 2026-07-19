{{-- Cover Page Partial - BAST PDF --}}
{{-- Variables: $bast, $client, $settings --}}

@php
    $bulanIndonesia = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
        4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September',
        10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];
    $bulan = $bulanIndonesia[$bast->tanggal->month] ?? '';
    $tahun = $bast->tanggal->year;
@endphp

<div style="text-align: center; border: 3px solid #0099cc; padding: 15px;">
    <div style="border: 1px solid #0099cc; padding: 40px 30px;">

        {{-- Top decorative line --}}
        <table style="width: 100%; border: none; margin-bottom: 60px;">
            <tr>
                <td style="border: none; text-align: center;">
                    <div style="width: 80px; height: 4px; background-color: #0099cc; margin: 0 auto;"></div>
                </td>
            </tr>
        </table>

        {{-- Client Logo --}}
        @if(!empty($client->logo))
            @php
                $logoPath = storage_path('app/public/' . $client->logo);
            @endphp
            @if(file_exists($logoPath))
                <div style="margin-bottom: 40px; text-align: center;">
                    <img src="{{ $logoPath }}" style="max-height: 80px; max-width: 200px;" alt="Client Logo">
                </div>
            @endif
        @endif

        {{-- Client Name --}}
        <div style="margin-bottom: 50px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #222; text-transform: uppercase; letter-spacing: 2px;">
                {{ $client->name ?? '' }}
            </span>
        </div>

        {{-- Decorative separator --}}
        <table style="width: 100%; border: none; margin-bottom: 50px;">
            <tr>
                <td style="border: none; text-align: center;">
                    <div style="width: 120px; height: 2px; background-color: #0099cc; margin: 0 auto;"></div>
                </td>
            </tr>
        </table>

        {{-- Document Title --}}
        <div style="margin-bottom: 30px; text-align: center;">
            <span style="font-size: 16px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 1px;">
                Berita Acara Serah Terima
            </span>
        </div>

        {{-- Month and Year --}}
        <div style="margin-bottom: 60px; text-align: center;">
            <span style="font-size: 18px; font-weight: bold; color: #222;">
                {{ $bulan }} {{ $tahun }}
            </span>
        </div>

        {{-- Decorative separator --}}
        <table style="width: 100%; border: none; margin-bottom: 60px;">
            <tr>
                <td style="border: none; text-align: center;">
                    <div style="width: 60px; height: 2px; background-color: #0099cc; margin: 0 auto;"></div>
                </td>
            </tr>
        </table>

        {{-- Company Info --}}
        <div style="margin-top: 40px; text-align: center;">
            <p style="font-size: 14px; font-weight: bold; color: #222; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                {{ $settings['company_name'] ?? '' }}
            </p>
            <p style="font-size: 11px; color: #555; margin: 0;">
                {{ $settings['company_address'] ?? '' }}
            </p>
        </div>

        {{-- Bottom decorative line --}}
        <table style="width: 100%; border: none; margin-top: 60px;">
            <tr>
                <td style="border: none; text-align: center;">
                    <div style="width: 80px; height: 4px; background-color: #0099cc; margin: 0 auto;"></div>
                </td>
            </tr>
        </table>

    </div>
</div>
