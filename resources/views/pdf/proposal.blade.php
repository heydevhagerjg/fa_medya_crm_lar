<!DOCTYPE html>
<html lang="tr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Teklif - {{ $proposal->title }}</title>
    <style>
        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            padding: 40px;
        }
        .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 20px;
        }
        .header table {
            width: 100%;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
        }
        .doc-title {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            text-transform: uppercase;
        }
        .info-section {
            margin-bottom: 30px;
        }
        .info-section table {
            width: 100%;
        }
        .info-card {
            width: 50%;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            font-size: 10px;
            margin-bottom: 5px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }
        .total-section {
            float: right;
            width: 300px;
        }
        .total-row {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .total-label {
            float: left;
            font-weight: bold;
        }
        .total-value {
            float: right;
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            position: fixed;
            bottom: 30px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        .description {
            margin-bottom: 30px;
            background: #fdfdfd;
            padding: 15px;
            border-left: 4px solid #e5e7eb;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <table>
                <tr>
                    <td class="company-name">{{ $proposal->tenant->name }}</td>
                    <td class="doc-title">Hizmet Teklif Formu</td>
                </tr>
            </table>
        </div>

        <div class="info-section">
            <table cellpadding="0" cellspacing="0">
                <tr>
                    <td class="info-card">
                        <div class="label">Müşteri Bilgileri</div>
                        <strong>{{ $proposal->customer->name }}</strong><br>
                        {{ $proposal->customer->email }}<br>
                        {{ $proposal->customer->formatted_phone }}
                    </td>
                    <td class="info-card" style="text-align: right;">
                        <div class="label">Teklif Detayları</div>
                        <strong>No:</strong> #{{ $proposal->id }}<br>
                        <strong>Tarih:</strong> {{ $proposal->created_at->format('d.m.Y') }}<br>
                        <strong>Geçerlilik:</strong> {{ $proposal->valid_until ? $proposal->valid_until->format('d.m.Y') : 'Belirtilmedi' }}
                    </td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom: 10px;">
            <div class="label">Teklif Konusu</div>
            <h3 style="margin: 0;">{{ $proposal->title }}</h3>
        </div>

        @if($proposal->description)
        <div class="description">
            {{ $proposal->description }}
        </div>
        @endif

        <table class="items-table">
            <thead>
                <tr>
                    <th>Hizmet / Ürün Açıklaması</th>
                    <th style="text-align: center; width: 60px;">Adet</th>
                    <th style="text-align: right; width: 100px;">Birim Fiyat</th>
                    <th style="text-align: right; width: 100px;">Toplam</th>
                </tr>
            </thead>
            <tbody>
                @foreach($proposal->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td style="text-align: center;">{{ $item->quantity }}</td>
                    <td style="text-align: right;">{{ number_format($item->unit_price, 2, ',', '.') }} TL</td>
                    <td style="text-align: right;"><strong>{{ number_format($item->total_price, 2, ',', '.') }} TL</strong></td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total-section">
            @if($proposal->is_vat_included)
            <div class="total-row">
                <span class="total-label">ARA TOPLAM</span>
                <span class="total-value" style="font-size: 14px;">{{ number_format($proposal->subtotal, 2, ',', '.') }} TL</span>
            </div>
            <div class="total-row">
                <span class="total-label">KDV (%{{ $proposal->vat_rate }})</span>
                <span class="total-value" style="font-size: 14px;">{{ number_format($proposal->vat_amount, 2, ',', '.') }} TL</span>
            </div>
            @endif
            <div class="total-row" style="border-bottom: 2px solid #333;">
                <span class="total-label">GENEL TOPLAM</span>
                <span class="total-value">{{ number_format($proposal->total_price, 2, ',', '.') }} TL</span>
            </div>
            @if(!$proposal->is_vat_included)
            <div style="font-size: 10px; color: #666; margin-top: 5px; text-align: right;">
                * Belirtilen tutara KDV dahil değildir.
            </div>
            @endif
        </div>

        <div style="clear: both; margin-top: 50px;"></div>

        @if($proposal->installments->count() > 0)
        <div class="label" style="margin-bottom: 15px;">Ödeme Planı / Döngüsü</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Ödeme Açıklaması</th>
                    <th style="text-align: center; width: 60px;">Yüzde</th>
                    <th style="text-align: right; width: 120px;">Tutar</th>
                    <th style="text-align: center; width: 100px;">Tarih</th>
                </tr>
            </thead>
            <tbody>
                @foreach($proposal->installments as $ins)
                <tr>
                    <td>{{ $ins->description ?: ($loop->iteration . '. Ödeme') }}</td>
                    <td style="text-align: center;">%{{ number_format($ins->percentage, 2, ',', '.') }}</td>
                    <td style="text-align: right;"><strong>{{ number_format($ins->amount, 2, ',', '.') }} TL</strong></td>
                    <td style="text-align: center;">{{ $ins->payment_date ? $ins->payment_date->format('d.m.Y') : '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        <div class="footer">
            {{ $proposal->tenant->name }} - {{ config('app.name') }} aracılığıyla oluşturulmuştur.
        </div>
    </div>
</body>
</html>
