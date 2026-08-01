{{-- AC Recap Table Partial for PDF (dompdf compatible) --}}
{{-- Receives: $acRecapRows (array), $client (model with name property) --}}

@if(!empty($acRecapRows))
@php
    $amperePhaseLabels = ['r' => 'R', 's' => 'S', 't' => 'T'];
    $hasAmpereValue = fn($row, $timing, $phase) =>
        array_key_exists("ampere_{$timing}_{$phase}", $row)
        && $row["ampere_{$timing}_{$phase}"] !== null
        && $row["ampere_{$timing}_{$phase}"] !== '';
    $beforeAmperePhases = array_keys(array_filter(
        $amperePhaseLabels,
        fn($_label, $phase) => collect($acRecapRows)->contains(
            fn($row) => $hasAmpereValue($row, 'before', $phase)
        ),
        ARRAY_FILTER_USE_BOTH,
    ));
    $afterAmperePhases = array_keys(array_filter(
        $amperePhaseLabels,
        fn($_label, $phase) => collect($acRecapRows)->contains(
            fn($row) => $hasAmpereValue($row, 'after', $phase)
        ),
        ARRAY_FILTER_USE_BOTH,
    ));
    $hasAmpere = count($beforeAmperePhases) + count($afterAmperePhases) > 0;
    $headerRowCount = $hasAmpere ? 3 : 2;
@endphp
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
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 18px; vertical-align: middle;">NO</th>
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 50px; vertical-align: middle;">TANGGAL</th>
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 70px; vertical-align: middle;">LOKASI</th>
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 48px; vertical-align: middle;">TYPE AC</th>
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 48px; vertical-align: middle;">MEREK</th>
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 35px; vertical-align: middle;">Kapasitas</th>
                <th colspan="2" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold;">SUHU</th>
                @if($hasAmpere)
                <th colspan="{{ count($beforeAmperePhases) + count($afterAmperePhases) }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold;">AMPERE</th>
                @endif
                <th colspan="2" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold;">TEKANAN FREON</th>
                <th rowspan="{{ $headerRowCount }}" style="border: 1px solid #333; padding: 3px 2px; text-align: center; font-weight: bold; width: 55px; vertical-align: middle;">KETERANGAN</th>
            </tr>
            {{-- Header Row 2: BEFORE/AFTER sub-groups --}}
            <tr>
                <th rowspan="{{ $hasAmpere ? 2 : 1 }}" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 28px; vertical-align: middle;">BEFORE</th>
                <th rowspan="{{ $hasAmpere ? 2 : 1 }}" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 28px; vertical-align: middle;">AFTER</th>
                @if(count($beforeAmperePhases) > 0)
                <th colspan="{{ count($beforeAmperePhases) }}" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold;">BEFORE</th>
                @endif
                @if(count($afterAmperePhases) > 0)
                <th colspan="{{ count($afterAmperePhases) }}" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold;">AFTER</th>
                @endif
                <th rowspan="{{ $hasAmpere ? 2 : 1 }}" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 30px; vertical-align: middle;">BEFORE</th>
                <th rowspan="{{ $hasAmpere ? 2 : 1 }}" style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 30px; vertical-align: middle;">AFTER</th>
            </tr>
            @if($hasAmpere)
            <tr>
                @foreach($beforeAmperePhases as $phase)
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">{{ $amperePhaseLabels[$phase] }}</th>
                @endforeach
                @foreach($afterAmperePhases as $phase)
                <th style="border: 1px solid #333; padding: 2px 1px; text-align: center; font-weight: bold; width: 20px;">{{ $amperePhaseLabels[$phase] }}</th>
                @endforeach
            </tr>
            @endif
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
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ ($row['suhu_before'] ?? null) === null || $row['suhu_before'] === '' ? '-' : $row['suhu_before'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ ($row['suhu_after'] ?? null) === null || $row['suhu_after'] === '' ? '-' : $row['suhu_after'] }}</td>
                @foreach($beforeAmperePhases as $phase)
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $hasAmpereValue($row, 'before', $phase) ? $row["ampere_before_{$phase}"] : '-' }}</td>
                @endforeach
                @foreach($afterAmperePhases as $phase)
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ $hasAmpereValue($row, 'after', $phase) ? $row["ampere_after_{$phase}"] : '-' }}</td>
                @endforeach
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ ($row['freon_before'] ?? null) === null || $row['freon_before'] === '' ? '-' : $row['freon_before'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: center;">{{ ($row['freon_after'] ?? null) === null || $row['freon_after'] === '' ? '-' : $row['freon_after'] }}</td>
                <td style="border: 1px solid #333; padding: 3px 2px; text-align: left; font-size: 8px;">{{ $row['keterangan'] ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif
