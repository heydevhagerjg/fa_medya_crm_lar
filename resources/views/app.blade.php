<!doctype html>
<html lang="tr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="FA Medya CRM - Profesyonel Müşteri Yönetim Sistemi" />
        <title>FA Medya CRM</title>
        <meta name="csrf-token" content="{{ csrf_token() }}" />
        @viteReactRefresh
        @vite(['resources/js/main.jsx'])
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
