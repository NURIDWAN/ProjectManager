{{-- AC Recap Table Partial for PDF (dompdf compatible) --}}
{{-- Receives: $acRecapRows (array), $client (model with name property) --}}

@if(!empty($acRecapRows))
<div style="margin-bottom: 20px;">
    {{-- Title bar --}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
        <tr>
            <td style="background-color: #87CEEB; color: #000; text-align: center; padding: 6px 10px; font-size: 12px; font-weight: bold; text-transform: uppercase; border: 1px solid #333;">
                REKAP DATA PEKERJAAN MAINTENANCE AC {{ strtoupper($client->name ?? '') }}
            </td>
        </tr>
    </table>

    {{-- Data Table --}}
    <table style="width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed;">
        <thead>
            {{-- Header Row 1: Top-level groups --}}
            <tr>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 18px; vertical-align: middle;">NO</th>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 50px; vertical-align: middle;">TANGGAL</th>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 70px; vertical-align: middle;">LOKASI</th>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 48px; vertical-align: middle;">TYPE AC</th>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 48px; vertical-align: middle;">MEREK</th>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 35px; vertical-align: middle;">Kapasitas</th>
                <th colspan="2" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold;">SUHU</th>
                <th colspan="6" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold;">AMPERE</th>
                <th colspan="2" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold;">TEKANAN FREON</th>
                <th rowspan="3" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 55px; vertical-align: middle;">KETERANGAN</th>
            </tr>
            {{-- Header Row 2: BEFORE/AFTER sub-groups --}}
            <tr>
                <th rowspan="2" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 28px; vertical-align: middle;">BEFORE</th>
                <th rowspan="2" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 28px; vertical-align: middle;">AFTER</th>
                <th colspan="3" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold;">BEFORE</th>
                <th colspan="3" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold;">AFTER</th>
                <th rowspan="2" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 30px; vertical-align: middle;">BEFORE</th>
                <th rowspan="2" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 30px; vertical-align: middle;">AFTER</th>
            </tr>
            {{-- Header Row 3: R/S/T for Ampere --}}
            <tr>
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">R</th>
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">S</th>
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">T</th>
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">R</th>
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">S</th>
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">T</th>
            </tr>
        </thead>
        <tbody>
            @foreach($acRecapRows as $row)
            <tr>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['no'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['tanggal'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: left;">{{ $row['lokasi'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['tipe_ac'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['merek'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['kapasitas'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['suhu_before_r'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['suhu_after_r'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['ampere_before_r'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['ampere_before_s'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['ampere_before_t'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['ampere_after_r'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['ampere_after_s'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['ampere_after_t'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['freon_before'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $row['freon_after'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: left; font-size: 8px;">{{ $row['keterangan'] ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif
