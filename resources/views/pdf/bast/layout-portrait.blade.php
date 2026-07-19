<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>BAST - {{ $bast->document_number ?? '' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .page-break-after {
            page-break-after: always;
        }

        table {
            border-collapse: collapse;
        }

        h1, h2, h3, h4 {
            color: #222;
        }

        p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="section-cover page-break-after">
        {!! $coverHtml !!}
    </div>
    <div class="section-surat" style="padding: 0 5mm;">
        {!! $suratHtml !!}
    </div>
</body>
</html>
