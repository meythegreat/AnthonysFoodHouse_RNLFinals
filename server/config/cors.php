<?php

return [

    'paths' => ['api/*', 'storage/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // CHANGED THIS LINE TO ALLOW ANY PORT:
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Change this to false since you are using Bearer Tokens (localStorage),
    // not browser cookies, for authentication!
    'supports_credentials' => false,

];
