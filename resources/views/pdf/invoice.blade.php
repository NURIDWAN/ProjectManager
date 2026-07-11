<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice {{ $invoice->invoice_number }}</title>
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
            color: #222;
            padding: 30px 40px;
        }

        /* Header Section */
        .header {
            width: 100%;
            margin-bottom: 20px;
        }

        .header table {
            width: 100%;
        }

        .header td {
            vertical-align: top;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .company-detail {
            font-size: 10px;
            color: #333;
            line-height: 1.5;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            text-align: right;
            letter-spacing: 2px;
        }

        /* Invoice Meta - Right aligned info */
        .invoice-meta {
            width: 100%;
            margin-bottom: 20px;
        }

        .invoice-meta table {
            width: 100%;
        }

        .invoice-meta .left-col {
            width: 55%;
            vertical-align: top;
        }

        .invoice-meta .right-col {
            width: 45%;
            vertical-align: top;
        }

        .meta-table {
            width: 100%;
        }

        .meta-table td {
            padding: 2px 0;
            font-size: 11px;
        }

        .meta-table .label {
            font-weight: bold;
            text-transform: uppercase;
            width: 120px;
        }

        .meta-table .separator {
            width: 10px;
            text-align: center;
        }

        .meta-table .value {
            text-align: right;
        }

        /* Client Box */
        .client-box {
            margin-bottom: 25px;
            padding: 10px 12px;
            border-left: 4px solid #6b9e3a;
            background-color: #f0f7e8;
        }

        .client-box .label {
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .client-box p {
            font-size: 10px;
            margin: 1px 0;
            line-height: 1.5;
        }

        .client-box .client-name {
            font-weight: bold;
            font-size: 11px;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .items-table th {
            background-color: #6b9e3a;
            color: #fff;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
            text-transform: uppercase;
            padding: 8px 6px;
            border: 1px solid #5a8a30;
        }

        .items-table td {
            border: 1px solid #c5c5c5;
            padding: 6px 8px;
            font-size: 10px;
        }

        .items-table td.center {
            text-align: center;
        }

        .items-table td.number {
            text-align: right;
            white-space: nowrap;
        }

        .items-table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* Empty rows for visual spacing */
        .items-table .empty-row td {
            height: 20px;
            border-left: 1px solid #c5c5c5;
            border-right: 1px solid #c5c5c5;
            border-bottom: 1px solid #e0e0e0;
        }

        /* Bottom Section */
        .bottom-section {
            width: 100%;
            margin-top: 0;
        }

        .bottom-section table {
            width: 100%;
        }

        .bottom-section td {
            vertical-align: top;
        }

        .bottom-left {
            width: 55%;
            padding-top: 10px;
        }

        .bottom-right {
            width: 45%;
        }

        /* Totals */
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 5px 8px;
            font-size: 11px;
            border: 1px solid #c5c5c5;
        }

        .totals-table .label {
            font-weight: bold;
            text-align: right;
            text-transform: uppercase;
        }

        .totals-table .value {
            text-align: right;
            white-space: nowrap;
            width: 140px;
        }

        .totals-table .grand-total td {
            font-weight: bold;
            font-size: 12px;
            background-color: #f0f7e8;
            border-top: 2px solid #6b9e3a;
        }

        /* Payment Info */
        .payment-info {
            font-size: 10px;
            line-height: 1.6;
        }

        .payment-info .title {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 3px;
        }

        /* Signature Area */
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
            font-size: 10px;
            margin-bottom: 5px;
        }

        .signature-area .sign-name {
            margin-top: 65px;
            font-size: 10px;
        }

        .signature-area .sign-line {
            border-bottom: 1px solid #333;
            display: inline-block;
            width: 160px;
            margin-bottom: 3px;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8px;
            color: #999;
            border-top: 1px solid #e0e0e0;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    {{-- Header: Company Name + INVOICE title --}}
    <div class="header">
        <table>
            <tr>
                <td style="width: 60%;">
                    <div class="company-name">{{ config('app.company_name', 'PT MAJU JAYA BERSAMA') }}</div>
                    <div class="company-detail">
                        {{ config('app.company_address', 'Gedung Merah Putih Lt. 10') }}<br>
                        {{ config('app.company_address_2', 'Jl. Laksamana Sukardi No. 5 Pluit Jakarta Utara') }}<br>
                        Telp. {{ config('app.company_phone', '021 6519090') }}
                    </div>
                </td>
                <td style="width: 40%;">
                    <div class="invoice-title">INVOICE</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Invoice Meta Info --}}
    <div class="invoice-meta">
        <table>
            <tr>
                <td class="left-col"></td>
                <td class="right-col">
                    <table class="meta-table">
                        <tr>
                            <td class="label">Tanggal</td>
                            <td class="separator">:</td>
                            <td class="value">{{ $invoice->created_at->translatedFormat('d F Y') }}</td>
                        </tr>
                        <tr>
                            <td class="label">No. Invoice</td>
                            <td class="separator">:</td>
                            <td class="value">{{ $invoice->invoice_number }}</td>
                        </tr>
                        <tr>
                            <td class="label">Termin</td>
                            <td class="separator">:</td>
                            <td class="value">
                                @if($invoice->due_date)
                                    {{ $invoice->created_at->diffInDays($invoice->due_date) }} hari
                                @else
                                    -
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td class="label">Due Date</td>
                            <td class="separator">:</td>
                            <td class="value">{{ $invoice->due_date ? $invoice->due_date->translatedFormat('d F Y') : '-' }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- Client Info Box --}}
    <div class="client-box">
        <div class="label">Tagihan Kepada:</div>
        <p class="client-name">{{ $client->pic_name ?? $client->name }}</p>
        <p>{{ $client->name }}</p>
        @if($client->address)
            <p>{{ $client->address }}</p>
        @endif
        @if($client->npwp)
            <p>{{ $client->npwp }}</p>
        @endif
        @if($client->pic_phone)
            <p>{{ $client->pic_phone }}</p>
        @endif
    </div>

    {{-- Items Table --}}
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 45%;">Deskripsi</th>
                <th style="width: 10%;">Jml</th>
                <th style="width: 22%;">Harga Satuan</th>
                <th style="width: 23%;">Sub Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
                <tr>
                    <td>{{ $item->service->name ?? '-' }}</td>
                    <td class="center">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                    <td class="number">{{ number_format($item->unit_price, 0, ',', '.') }}</td>
                    <td class="number">{{ number_format($item->line_total, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            {{-- Empty rows to fill table visually (like the image) --}}
            @for($i = count($items); $i < 8; $i++)
                <tr class="empty-row">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">-</td>
                </tr>
            @endfor
        </tbody>
    </table>

    {{-- Bottom Section: Payment info left, Totals right --}}
    <div class="bottom-section">
        <table>
            <tr>
                <td class="bottom-left">
                    <div class="payment-info">
                        <div class="title">Pembayaran ditujukan kepada:</div>
                        <p>Bank: {{ config('app.bank_name', 'Mandiri Cabang Pluit Jakarta Utara') }}</p>
                        <p>Atas Nama: {{ config('app.bank_account_name', config('app.company_name', 'PT MAJU JAYA BERSAMA')) }}</p>
                        <p>No Rekening: {{ config('app.bank_account_number', '8349203918') }}</p>
                    </div>
                </td>
                <td class="bottom-right">
                    <table class="totals-table">
                        <tr>
                            <td class="label">Subtotal</td>
                            <td class="value">{{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td class="label">Tarif Pajak</td>
                            <td class="value">11%</td>
                        </tr>
                        <tr>
                            <td class="label">Pajak Penjualan</td>
                            <td class="value">{{ number_format($invoice->ppn, 0, ',', '.') }}</td>
                        </tr>
                        @if($invoice->discount_total > 0)
                        <tr>
                            <td class="label">Diskon</td>
                            <td class="value">-{{ number_format($invoice->discount_total, 0, ',', '.') }}</td>
                        </tr>
                        @endif
                        <tr>
                            <td class="label">Lainnya</td>
                            <td class="value"></td>
                        </tr>
                        <tr class="grand-total">
                            <td class="label">Total</td>
                            <td class="value">{{ number_format($invoice->grand_total, 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- Signature Area --}}
    <div class="signature-area">
        <table>
            <tr>
                <td>
                    <div class="sign-label">Hormat Kami,</div>
                    <div class="sign-name">
                        <div class="sign-line">&nbsp;</div><br>
                        {{ config('app.company_name', 'PT MAJU JAYA BERSAMA') }}
                    </div>
                </td>
                <td>
                    <div class="sign-label">Diterima Oleh,</div>
                    <div class="sign-name">
                        <div class="sign-line">&nbsp;</div><br>
                        {{ $client->pic_name ?? '(...............................)' }}
                    </div>
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
