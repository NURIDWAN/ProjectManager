{{-- BAST Laporan Pekerjaan Page (partial, no full HTML document) --}}
{{-- Receives: $bast, $client, $workReports, $acRecapRows, $settings --}}

{{-- Title --}}
<div style="text-align: center; margin-bottom: 20px;">
    <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">LAPORAN PEKERJAAN</h2>
</div>

{{-- AC Recap Table (Rekap Pekerjaan) - rendered first before photo documentation --}}
@if(!empty($acRecapRows))
<div style="margin-bottom: 20px;">
    @include('pdf.partials.ac-recap-table', ['acRecapRows' => $acRecapRows, 'client' => $client])
</div>
@endif

{{-- Work Report Details --}}
@if($workReports->count() > 0)
    @foreach($workReports as $index => $report)
    @php
        $reportIsAc = $report->category && $report->category->preset_identifier === 'ac_maintenance';
    @endphp

    @if(!$reportIsAc)
    {{-- Non-AC reports: standard detail with info table + photos --}}
    <div style="margin-bottom: 25px; {{ !$loop->last ? 'border-bottom: 2px solid #333; padding-bottom: 20px;' : '' }}">
        {{-- Info Table per Report --}}
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; width: 140px; font-weight: bold;">Tanggal Pekerjaan</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; width: 15px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ ($report->submitted_at ?? $report->created_at)->translatedFormat('d F Y') }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Jenis Pekerjaan</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $report->category->name ?? '-' }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Deskripsi</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $report->description ?? '-' }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Area</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $report->area ?? '-' }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Teknisi</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $report->technician->name ?? '-' }}</td>
            </tr>
        </table>

        {{-- Photo Documentation --}}
        @php
            $beforePhotos = $report->beforePhotoItems;
            $afterPhotos = $report->afterPhotoItems;
        @endphp

        @if($beforePhotos->count() > 0 || $afterPhotos->count() > 0)
        <table style="width: 100%; border-collapse: collapse;">
            {{-- Header Row --}}
            <tr>
                <th style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 11px; width: 35px;">NO</th>
                <th style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 11px;">VISUAL {{ strtoupper($report->category->name ?? 'UNIT') }}</th>
            </tr>

            {{-- Before Photos Row --}}
            @if($beforePhotos->count() > 0)
            <tr>
                <td style="border: 1px solid #333; padding: 5px; text-align: center; vertical-align: top; font-weight: bold; width: 35px;">{{ $index + 1 }}</td>
                <td style="border: 1px solid #333; padding: 8px;">
                    <table style="width: 100%; border: none;">
                        @foreach($beforePhotos->chunk(3) as $chunk)
                        <tr>
                            @foreach($chunk as $photo)
                            <td style="width: 33.33%; text-align: center; vertical-align: top; padding: 5px; border: none;">
                                @php
                                    $photoPath = storage_path('app/public/' . $photo->photo_path);
                                @endphp
                                @if(file_exists($photoPath))
                                    <img src="{{ $photoPath }}" style="width: 100%; max-height: 140px; object-fit: cover; border: 1px solid #ccc;" alt="{{ $photo->caption ?? 'Before' }}">
                                @else
                                    <div style="width: 100%; height: 100px; background: #eee; border: 1px solid #ccc; font-size: 9px; color: #999; text-align: center; padding-top: 40px;">Foto tidak ditemukan</div>
                                @endif
                                <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-top: 3px; text-align: center;">{{ $photo->caption ?? 'BEFORE' }}</div>
                            </td>
                            @endforeach
                            @for($i = $chunk->count(); $i < 3; $i++)
                            <td style="width: 33.33%; border: none;"></td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif

            {{-- After Section Header --}}
            @if($afterPhotos->count() > 0)
            <tr>
                <th style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; font-size: 11px; width: 35px;"></th>
                <th style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 11px;">VISUAL {{ strtoupper($report->category->name ?? 'UNIT') }} AFTER</th>
            </tr>

            {{-- After Photos Row --}}
            <tr>
                <td style="border: 1px solid #333; padding: 5px; text-align: center; vertical-align: top; width: 35px;"></td>
                <td style="border: 1px solid #333; padding: 8px;">
                    <table style="width: 100%; border: none;">
                        @foreach($afterPhotos->chunk(3) as $chunk)
                        <tr>
                            @foreach($chunk as $photo)
                            <td style="width: 33.33%; text-align: center; vertical-align: top; padding: 5px; border: none;">
                                @php
                                    $photoPath = storage_path('app/public/' . $photo->photo_path);
                                @endphp
                                @if(file_exists($photoPath))
                                    <img src="{{ $photoPath }}" style="width: 100%; max-height: 140px; object-fit: cover; border: 1px solid #ccc;" alt="{{ $photo->caption ?? 'After' }}">
                                @else
                                    <div style="width: 100%; height: 100px; background: #eee; border: 1px solid #ccc; font-size: 9px; color: #999; text-align: center; padding-top: 40px;">Foto tidak ditemukan</div>
                                @endif
                                <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-top: 3px; text-align: center;">{{ $photo->caption ?? 'AFTER' }}</div>
                            </td>
                            @endforeach
                            @for($i = $chunk->count(); $i < 3; $i++)
                            <td style="width: 33.33%; border: none;"></td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif
        </table>
        @endif
    </div>
    @endif
    @endforeach

    {{-- AC Preset: Per-unit photo documentation - each unit on its own page --}}
    @php
        $hasAcReports = $workReports->contains(fn($r) => $r->category && $r->category->preset_identifier === 'ac_maintenance');
    @endphp

    @if($hasAcReports)
    @php
        $globalUnitNo = 0;
    @endphp
    @foreach($workReports as $index => $report)
    @php
        $reportIsAcDoc = $report->category && $report->category->preset_identifier === 'ac_maintenance';
        $presetDataDoc = $report->preset_data;
        $allBeforePhotos = $report->beforePhotoItems;
        $allAfterPhotos = $report->afterPhotoItems;
    @endphp
    @if($reportIsAcDoc && is_array($presetDataDoc) && count($presetDataDoc) > 0)
    @foreach($presetDataDoc as $unitIndex => $unitEntry)
    @php
        $globalUnitNo++;
        $prefix = "ac_unit_{$unitIndex}";
        $unitBeforePhotos = $allBeforePhotos->filter(fn($p) => str_starts_with($p->caption ?? '', $prefix));
        $unitAfterPhotos = $allAfterPhotos->filter(fn($p) => str_starts_with($p->caption ?? '', $prefix));
        $tipeAc = strtoupper($unitEntry['tipe_ac'] ?? 'AC');
    @endphp
    @if($unitBeforePhotos->count() > 0 || $unitAfterPhotos->count() > 0)
    <div style="page-break-before: always;">
        {{-- Info header for context --}}
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; width: 140px; font-weight: bold;">Tanggal Pekerjaan</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; width: 15px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ ($report->submitted_at ?? $report->created_at)->translatedFormat('d F Y') }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Jenis Pekerjaan</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $report->category->name ?? '-' }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Area</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $report->area ?? '-' }} ({{ $unitEntry['merk_ac'] ?? '' }} {{ $unitEntry['kapasitas_pk'] ?? '' }} PK)</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">Konsumen</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $client->name ?? '-' }}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">A l a m a t</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; text-align: center;">:</td>
                <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11px; font-weight: bold;">{{ $client->address ?? '-' }}</td>
            </tr>
        </table>

        {{-- Photo table for this single unit --}}
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <th style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 11px; width: 35px;">NO</th>
                <th style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 11px;">VISUAL UNIT AC {{ $tipeAc }}</th>
            </tr>
            {{-- Before --}}
            @if($unitBeforePhotos->count() > 0)
            <tr>
                <td style="border: 1px solid #333; padding: 5px; text-align: center; vertical-align: top; font-weight: bold; width: 35px;" rowspan="{{ $unitAfterPhotos->count() > 0 ? 4 : 2 }}">{{ $globalUnitNo }}</td>
                <td style="border: 1px solid #333; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 9px;">
                    VISUAL UNIT AC {{ $tipeAc }} BEFORE
                </td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 8px;">
                    <table style="width: 100%; border: none;">
                        @foreach($unitBeforePhotos->values()->chunk(3) as $chunk)
                        <tr>
                            @foreach($chunk as $photo)
                            <td style="width: 33.33%; text-align: center; vertical-align: top; padding: 5px; border: none;">
                                @php
                                    $photoPath = storage_path('app/public/' . $photo->photo_path);
                                    $userCaption = str_starts_with($photo->caption ?? '', $prefix . ':') ? substr($photo->caption, strlen($prefix) + 1) : '';
                                @endphp
                                @if(file_exists($photoPath))
                                    <img src="{{ $photoPath }}" style="width: 100%; max-height: 140px; object-fit: cover; border: 1px solid #ccc;" alt="{{ $userCaption }}">
                                @else
                                    <div style="width: 100%; height: 100px; background: #eee; border: 1px solid #ccc; font-size: 9px; color: #999; text-align: center; padding-top: 40px;">Foto tidak ditemukan</div>
                                @endif
                                <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-top: 3px; text-align: center;">{{ strtoupper($userCaption ?: 'BEFORE') }}</div>
                            </td>
                            @endforeach
                            @for($i = $chunk->count(); $i < 3; $i++)
                            <td style="width: 33.33%; border: none;"></td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif
            {{-- After --}}
            @if($unitAfterPhotos->count() > 0)
            <tr>
                @if($unitBeforePhotos->count() === 0)
                <td style="border: 1px solid #333; padding: 5px; text-align: center; vertical-align: top; font-weight: bold; width: 35px;" rowspan="2">{{ $globalUnitNo }}</td>
                @endif
                <td style="border: 1px solid #333; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 9px;">
                    VISUAL UNIT AC {{ $tipeAc }} AFTER
                </td>
            </tr>
            <tr>
                <td style="border: 1px solid #333; padding: 8px;">
                    <table style="width: 100%; border: none;">
                        @foreach($unitAfterPhotos->values()->chunk(3) as $chunk)
                        <tr>
                            @foreach($chunk as $photo)
                            <td style="width: 33.33%; text-align: center; vertical-align: top; padding: 5px; border: none;">
                                @php
                                    $photoPath = storage_path('app/public/' . $photo->photo_path);
                                    $userCaption = str_starts_with($photo->caption ?? '', $prefix . ':') ? substr($photo->caption, strlen($prefix) + 1) : '';
                                @endphp
                                @if(file_exists($photoPath))
                                    <img src="{{ $photoPath }}" style="width: 100%; max-height: 140px; object-fit: cover; border: 1px solid #ccc;" alt="{{ $userCaption }}">
                                @else
                                    <div style="width: 100%; height: 100px; background: #eee; border: 1px solid #ccc; font-size: 9px; color: #999; text-align: center; padding-top: 40px;">Foto tidak ditemukan</div>
                                @endif
                                <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-top: 3px; text-align: center;">{{ strtoupper($userCaption ?: 'AFTER') }}</div>
                            </td>
                            @endforeach
                            @for($i = $chunk->count(); $i < 3; $i++)
                            <td style="width: 33.33%; border: none;"></td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif
        </table>
    </div>
    @endif
    @endforeach
    @endif
    @endforeach
    @endif

@else
    <p style="font-size: 11px; font-style: italic; text-align: center;">Tidak ada laporan pekerjaan terkait.</p>
@endif
