<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>BAP - {{ $bap->nomor_surat }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            padding: 30px;
        }

        .header {
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
        }

        .document-info {
            margin-bottom: 20px;
        }

        .document-info table {
            width: 100%;
        }

        .document-info td {
            padding: 2px 0;
            vertical-align: top;
        }

        .document-info .label {
            width: 130px;
            font-weight: bold;
        }

        .document-info .separator {
            width: 15px;
            text-align: center;
        }

        /* Work Report Section */
        .work-report-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .info-table td {
            border: 1px solid #333;
            padding: 4px 8px;
            font-size: 11px;
        }

        .info-table .label-col {
            width: 140px;
            font-weight: bold;
        }

        .info-table .sep-col {
            width: 15px;
            text-align: center;
        }

        .info-table .value-col {
            font-weight: bold;
        }

        /* Rekap Table */
        .work-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .work-table th,
        .work-table td {
            border: 1px solid #333;
            padding: 5px 8px;
            text-align: left;
            font-size: 10px;
        }

        .work-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
        }

        .work-table td.center {
            text-align: center;
        }

        /* Photo Table */
        .photo-table {
            width: 100%;
            border-collapse: collapse;
        }

        .photo-table th,
        .photo-table td {
            border: 1px solid #333;
            padding: 5px;
            text-align: center;
            vertical-align: middle;
            font-size: 11px;
        }

        .photo-table th {
            font-weight: bold;
            text-transform: uppercase;
            background-color: #fff;
        }

        .photo-table .no-col {
            width: 35px;
            font-weight: bold;
            vertical-align: top;
        }

        .photo-grid {
            width: 100%;
        }

        .photo-grid td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 5px;
            border: none;
        }

        .photo-grid img {
            width: 100%;
            max-height: 140px;
            object-fit: cover;
            border: 1px solid #ccc;
        }

        .photo-caption {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 3px;
            text-align: center;
        }

        /* Signature */
        .closing-text {
            margin-top: 25px;
            margin-bottom: 30px;
            text-align: justify;
        }

        .signature-area {
            margin-top: 40px;
            width: 100%;
        }

        .signature-area table {
            width: 100%;
        }

        .signature-area td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 10px;
        }

        .signature-area .sign-label {
            font-weight: bold;
            margin-bottom: 80px;
        }

        .signature-area .sign-line {
            border-bottom: 1px solid #333;
            display: inline-block;
            width: 180px;
            margin-bottom: 5px;
        }

        .signature-area .sign-name {
            font-weight: bold;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    {{-- Header from Company Settings --}}
    <div class="header">
        <table style="width: 100%; border: none;">
            <tr>
                <td style="width: 120px; vertical-align: middle; text-align: center; border: none; padding: 0;">
                    @if(!empty($settings['company_logo']))
                        <img src="{{ storage_path('app/public/' . $settings['company_logo']) }}" style="max-height: 60px; max-width: 110px;" alt="Logo">
                    @endif
                </td>
                <td style="vertical-align: middle; text-align: left; border: none; padding-left: 10px;">
                    <h1 style="margin: 0; font-size: 16px;">{{ strtoupper($settings['company_name'] ?? 'Dokumen Resmi') }}</h1>
                    <p style="margin: 2px 0; font-size: 10px;">{{ $settings['company_address'] ?? '' }}</p>
                    @if(!empty($settings['company_address_2']))
                        <p style="margin: 2px 0; font-size: 10px;">{{ $settings['company_address_2'] }}</p>
                    @endif
                    @if(!empty($settings['company_phone']))
                        <p style="margin: 2px 0; font-size: 10px;">Telp. {{ $settings['company_phone'] }}</p>
                    @endif
                </td>
            </tr>
        </table>
        <div style="margin-top: 8px; border-top: 3px solid #0099cc; border-bottom: 1px solid #0099cc; height: 6px;"></div>
    </div>

    {{-- Document Info --}}
    <!-- <div class="document-info">
        <table>
            <tr>
                <td class="label">Nomor Surat</td>
                <td class="separator">:</td>
                <td>{{ $bap->nomor_surat }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal</td>
                <td class="separator">:</td>
                <td>{{ $bap->tanggal->translatedFormat('d F Y') }}</td>
            </tr>
            <tr>
                <td class="label">Nama Klien</td>
                <td class="separator">:</td>
                <td>{{ $client->name ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Alamat Klien</td>
                <td class="separator">:</td>
                <td>{{ $client->address ?? '-' }}</td>
            </tr>
            @if($client->pic_name)
            <tr>
                <td class="label">PIC</td>
                <td class="separator">:</td>
                <td>{{ $client->pic_name }}</td>
            </tr>
            @endif
            <tr>
                <td class="label">Status</td>
                <td class="separator">:</td>
                <td>{{ ucfirst($bap->status) }}</td>
            </tr>
        </table>
    </div> -->

    {{-- Rekap Pekerjaan Table (hidden for AC-only BAPs since AC Recap Table replaces it) --}}
    @php
        $hasNonAcReports = $workReports->contains(fn($r) => !$r->category || $r->category->preset_identifier !== 'ac_maintenance');
        $hasAcReports = !empty($acRecapRows);
    @endphp
    @if($workReports->count() > 0 && ($hasNonAcReports || !$hasAcReports))
    <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">
            Rekap Pekerjaan
        </div>
        <table class="work-table">
            <thead>
                <tr>
                    <th style="width: 30px;">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th>Kategori</th>
                    <th>Deskripsi Pekerjaan</th>
                    <th style="width: 100px;">Teknisi</th>
                    <th style="width: 70px;">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($workReports as $idx => $report)
                <tr>
                    <td class="center">{{ $idx + 1 }}</td>
                    <td class="center">{{ $report->created_at->translatedFormat('d/m/Y') }}</td>
                    <td>{{ $report->category->name ?? '-' }}</td>
                    <td>{{ $report->description ?? '-' }}</td>
                    <td>{{ $report->technician->name ?? '-' }}</td>
                    <td class="center">{{ ucfirst($report->status) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- AC Recap Table (before photo documentation) --}}
    @include('pdf.partials.ac-recap-table', ['acRecapRows' => $acRecapRows, 'client' => $client])

    {{-- Detail Pekerjaan per Work Report --}}
    @if($workReports->count() > 0)
        @foreach($workReports as $index => $report)
        @php
            $reportIsAc = $report->category && $report->category->preset_identifier === 'ac_maintenance';
        @endphp
        @if(!$reportIsAc)
        {{-- Non-AC reports: show standard detail with info table + photos --}}
        <div class="work-report-section">
            {{-- Info Table per Report --}}
            <table class="info-table">
                <tr>
                    <td class="label-col">Tanggal Pekerjaan</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $report->created_at->translatedFormat('d F Y') }}</td>
                </tr>
                <tr>
                    <td class="label-col">Jenis Pekerjaan</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $report->category->name ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label-col">Area</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $report->area ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label-col">Konsumen</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $client->name ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label-col">Alamat</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $client->address ?? '-' }}</td>
                </tr>
            </table>

            {{-- Photo Documentation Table --}}
            @php
                $beforePhotos = $report->beforePhotoItems;
                $afterPhotos = $report->afterPhotoItems;
            @endphp

            @if($beforePhotos->count() > 0 || $afterPhotos->count() > 0)
            <table class="photo-table">
                {{-- Header Row --}}
                <tr>
                    <th class="no-col">NO</th>
                    <th>VISUAL {{ strtoupper($report->category->name ?? 'UNIT') }}</th>
                </tr>

                {{-- Before Photos Row --}}
                @if($beforePhotos->count() > 0)
                <tr>
                    <td class="no-col">{{ $index + 1 }}</td>
                    <td style="padding: 8px;">
                        <table class="photo-grid">
                            @foreach($beforePhotos->chunk(3) as $chunk)
                            <tr>
                                @foreach($chunk as $photo)
                                <td>
                                    @php
                                        $photoPath = storage_path('app/public/' . $photo->photo_path);
                                    @endphp
                                    @if(file_exists($photoPath))
                                        <img src="{{ $photoPath }}" alt="{{ $photo->caption ?? 'Before' }}">
                                    @else
                                        <div style="width:100%;height:100px;background:#eee;border:1px solid #ccc;font-size:9px;color:#999;text-align:center;padding-top:40px;">Foto tidak ditemukan</div>
                                    @endif
                                    <div class="photo-caption">{{ $photo->caption ?? 'BEFORE' }}</div>
                                </td>
                                @endforeach
                                @for($i = $chunk->count(); $i < 3; $i++)
                                <td></td>
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
                    <th class="no-col"></th>
                    <th>VISUAL {{ strtoupper($report->category->name ?? 'UNIT') }} AFTER</th>
                </tr>

                {{-- After Photos Row --}}
                <tr>
                    <td class="no-col"></td>
                    <td style="padding: 8px;">
                        <table class="photo-grid">
                            @foreach($afterPhotos->chunk(3) as $chunk)
                            <tr>
                                @foreach($chunk as $photo)
                                <td>
                                    @php
                                        $photoPath = storage_path('app/public/' . $photo->photo_path);
                                    @endphp
                                    @if(file_exists($photoPath))
                                        <img src="{{ $photoPath }}" alt="{{ $photo->caption ?? 'After' }}">
                                    @else
                                        <div style="width:100%;height:100px;background:#eee;border:1px solid #ccc;font-size:9px;color:#999;text-align:center;padding-top:40px;">Foto tidak ditemukan</div>
                                    @endif
                                    <div class="photo-caption">{{ $photo->caption ?? 'AFTER' }}</div>
                                </td>
                                @endforeach
                                @for($i = $chunk->count(); $i < 3; $i++)
                                <td></td>
                                @endfor
                            </tr>
                            @endforeach
                        </table>
                    </td>
                </tr>
                @endif
            </table>
            @endif

            {{-- Description/Keterangan --}}
            @if($report->description)
            <div style="margin-top: 5px; padding: 5px 8px; border: 1px solid #333; border-top: none;">
                <strong style="font-size: 10px;">Keterangan:</strong>
                <p style="font-size: 10px; margin-top: 3px;">{{ $report->description }}</p>
            </div>
            @endif
        </div>
        @endif
        @endforeach

        {{-- AC Preset: Per-unit photo documentation - each unit on its own page --}}
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
            <table class="info-table" style="margin-bottom: 10px;">
                <tr>
                    <td class="label-col">Tanggal Pekerjaan</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $report->created_at->translatedFormat('d F Y') }}</td>
                </tr>
                <tr>
                    <td class="label-col">Jenis Pekerjaan</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $report->category->name ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label-col">Area</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $report->area ?? '-' }} ({{ $unitEntry['merk_ac'] ?? '' }} {{ $unitEntry['kapasitas_pk'] ?? '' }} PK)</td>
                </tr>
                <tr>
                    <td class="label-col">Konsumen</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $client->name ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label-col">A l a m a t</td>
                    <td class="sep-col">:</td>
                    <td class="value-col">{{ $client->address ?? '-' }}</td>
                </tr>
            </table>

            {{-- Photo table for this single unit --}}
            <table class="photo-table">
                <tr>
                    <th class="no-col">NO</th>
                    <th>VISUAL UNIT AC {{ $tipeAc }}</th>
                </tr>
                {{-- Before --}}
                @if($unitBeforePhotos->count() > 0)
                <tr>
                    <td class="no-col" rowspan="{{ $unitAfterPhotos->count() > 0 ? 4 : 2 }}">{{ $globalUnitNo }}</td>
                    <td style="padding: 4px 8px; text-align: center; font-weight: bold; font-size: 9px; border-bottom: 1px solid #333;">
                        VISUAL UNIT AC {{ $tipeAc }} BEFORE
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px;">
                        <table class="photo-grid">
                            @foreach($unitBeforePhotos->values()->chunk(3) as $chunk)
                            <tr>
                                @foreach($chunk as $photo)
                                <td>
                                    @php
                                        $photoPath = storage_path('app/public/' . $photo->photo_path);
                                        $userCaption = str_starts_with($photo->caption ?? '', $prefix . ':') ? substr($photo->caption, strlen($prefix) + 1) : '';
                                    @endphp
                                    @if(file_exists($photoPath))
                                        <img src="{{ $photoPath }}" alt="{{ $userCaption }}">
                                    @else
                                        <div style="width:100%;height:100px;background:#eee;border:1px solid #ccc;font-size:9px;color:#999;text-align:center;padding-top:40px;">Foto tidak ditemukan</div>
                                    @endif
                                    <div class="photo-caption">{{ strtoupper($userCaption ?: 'BEFORE') }}</div>
                                </td>
                                @endforeach
                                @for($i = $chunk->count(); $i < 3; $i++)
                                <td></td>
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
                    <td class="no-col" rowspan="2">{{ $globalUnitNo }}</td>
                    @endif
                    <td style="padding: 4px 8px; text-align: center; font-weight: bold; font-size: 9px; border-bottom: 1px solid #333;">
                        VISUAL UNIT AC {{ $tipeAc }} AFTER
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px;">
                        <table class="photo-grid">
                            @foreach($unitAfterPhotos->values()->chunk(3) as $chunk)
                            <tr>
                                @foreach($chunk as $photo)
                                <td>
                                    @php
                                        $photoPath = storage_path('app/public/' . $photo->photo_path);
                                        $userCaption = str_starts_with($photo->caption ?? '', $prefix . ':') ? substr($photo->caption, strlen($prefix) + 1) : '';
                                    @endphp
                                    @if(file_exists($photoPath))
                                        <img src="{{ $photoPath }}" alt="{{ $userCaption }}">
                                    @else
                                        <div style="width:100%;height:100px;background:#eee;border:1px solid #ccc;font-size:9px;color:#999;text-align:center;padding-top:40px;">Foto tidak ditemukan</div>
                                    @endif
                                    <div class="photo-caption">{{ strtoupper($userCaption ?: 'AFTER') }}</div>
                                </td>
                                @endforeach
                                @for($i = $chunk->count(); $i < 3; $i++)
                                <td></td>
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
        <p><em>Tidak ada detail pekerjaan terkait.</em></p>
    @endif

    {{-- Closing text & Signature (hidden for AC-only BAPs) --}}
    @if(!$hasAcReports || $hasNonAcReports)
    <div class="closing-text">
        <p>Demikian Berita Acara Pekerjaan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
    </div>

    {{-- Signature Area --}}
    <div class="signature-area">
        <table>
            <tr>
                <td>
                    <div class="sign-label">Pihak Pertama</div>
                    <br><br><br><br>
                    <div class="sign-line">&nbsp;</div>
                    <div class="sign-name">{{ $bap->signed_by ?? '(...............................)' }}</div>
                </td>
                <td>
                    <div class="sign-label">Pihak Kedua</div>
                    <br><br><br><br>
                    <div class="sign-line">&nbsp;</div>
                    <div class="sign-name">{{ $client->pic_name ?? '(...............................)' }}</div>
                </td>
            </tr>
        </table>
    </div>
    @endif

    {{-- Footer --}}
    <div class="footer">
        Dokumen ini di-generate secara otomatis pada {{ now()->translatedFormat('d F Y, H:i') }}
    </div>
</body>
</html>
