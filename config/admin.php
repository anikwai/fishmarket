<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Admin User Configuration
    |--------------------------------------------------------------------------
    |
    | These configuration options are used when creating the initial admin
    | user during deployment. Set these values in your .env file:
    |
    | ADMIN_EMAIL=admin@example.com
    | ADMIN_NAME=Admin User
    | ADMIN_PASSWORD=secure-password
    |
    */

    'email' => env('ADMIN_EMAIL'),

    'name' => env('ADMIN_NAME'),

    'password' => env('ADMIN_PASSWORD'),

];
