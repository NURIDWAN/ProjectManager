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
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 40px;
        }

        .header {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }

        .header h2 {
            font-size: 14px;
            font-weight: normal;
            color: #555;
        }

        .document-info {
            margin-bottom: 25px;
        }

        .document-info table {
            width: 100%;
        }

        .document-info td {
            padding: 3px 0;
            vertical-align: top;
        }

        .document-info .label {
            width: 150px;
            font-weight: bold;
        }

        .document-info .separator {
            width: 20px;
            text-align: center;
        }

        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ccc;
        }

        .work-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .work-table th,
        .work-table td {
            border: 1px solid #999;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
        }

        .work-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        .work-table td.center {
            text-align: center;
        }

        .closing-text {
            margin-top: 30px;
            margin-bottom: 40px;
            text-align: justify;
        }

        .signature-area {
            margin-top: 50px;
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
            width: 200px;
            margin-bottom: 5px;
        }

        .signature-area .sign-name {
            font-weight: bold;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    {{-- Header --}}
    <div class="header">
        <h1>Berita Acara Pekerjaan</h1>
        <h2>Dokumen Resmi</h2>
    </div>

    {{-- Document Info --}}
    <div class="document-info">
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
    </div>

    {{-- Detail Pekerjaan --}}
    <div class="section-title">Detail Pekerjaan</div>

    @if($workReports->count() > 0)
        <table class="work-table">
            <thead>
                <tr>
                    <th style="width: 30px;">No</th>
                    <th>Kategori</th>
                    <th>Deskripsi Pekerjaan</th>
                    <th>Teknisi</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($workReports as $index => $report)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $report->category->name ?? '-' }}</td>
                    <td>{{ $report->description ?? '-' }}</td>
                    <td>{{ $report->technician->name ?? '-' }}</td>
                    <td class="center">{{ ucfirst($report->status) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p><em>Tidak ada detail pekerjaan terkait.</em></p>
    @endif

    {{-- Closing text --}}
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

    {{-- Footer --}}
    <div class="footer">
        Dokumen ini di-generate secara otomatis pada {{ now()->translatedFormat('d F Y, H:i') }}
    </div>
</body>
</html>
