<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | Development: MAIL_MAILER=log — all emails written to storage/logs/laravel.log
    | Production:  MAIL_MAILER=smtp — uses Gmail SMTP (see 'smtp' mailer below)
    |
    */

    'default' => env('MAIL_MAILER', 'log'),

    'mailers' => [

        /*
        |----------------------------------------------------------------------
        | Gmail SMTP
        |----------------------------------------------------------------------
        | Requires a Gmail account with 2-Step Verification enabled and an
        | App Password generated at: https://myaccount.google.com/apppasswords
        |
        | .env values to set for production:
        |   MAIL_MAILER=smtp
        |   MAIL_HOST=smtp.gmail.com
        |   MAIL_PORT=587
        |   MAIL_SCHEME=tls
        |   MAIL_USERNAME=your-gmail@gmail.com
        |   MAIL_PASSWORD=your-16-char-app-password
        |   MAIL_FROM_ADDRESS=your-gmail@gmail.com
        |   MAIL_FROM_NAME="Amkor Travel & Tours IMS"
        */
        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME', 'tls'),
            'host' => env('MAIL_HOST', 'smtp.gmail.com'),
            'port' => env('MAIL_PORT', 587),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        /*
        |----------------------------------------------------------------------
        | Log driver (development default)
        |----------------------------------------------------------------------
        | Writes email content to storage/logs/laravel.log instead of sending.
        | Verify notification content here during Phase 4 development.
        */
        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => ['smtp', 'log'],
            'retry_after' => 60,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'no-reply@amkor.ph'),
        'name' => env('MAIL_FROM_NAME', 'Amkor Travel & Tours IMS'),
    ],

];
