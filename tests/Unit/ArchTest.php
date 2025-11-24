<?php

declare(strict_types=1);

if (class_exists(Spoofchecker::class)) {
    arch()->preset()->php();
} else {
    test('arch php preset skipped without intl extension')->skip('intl extension (Spoofchecker) not available');
}
arch()->preset()->strict()->ignoring([
    'App\Models',
]);
arch()->preset()->security()->ignoring([
    'assert',
]);

arch('controllers')
    ->expect('App\Http\Controllers')
    ->not->toBeUsed();

//
