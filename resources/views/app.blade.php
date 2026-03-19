<!doctype html>
<html lang="tr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="{{ config('app.name') }} - Profesyonel Müşteri Yönetim Sistemi" />
        <title>{{ config('app.name') }}</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <meta name="csrf-token" content="{{ csrf_token() }}" />
        @viteReactRefresh
        @vite(['resources/js/main.jsx'])
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
        <script type="text/javascript">
            Paddle.Initialize({ 
                token: "{{ config('cashier.client_side_token') }}",
                @if(config('cashier.sandbox'))
                environment: 'sandbox'
                @endif
            });
        </script>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
