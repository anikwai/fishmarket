<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

it('passes request to next middleware', function (): void {
    $middleware = new EnsureUserHasRole;
    $request = Request::create('/test', 'GET');
    $response = new Response('test response', 200);

    $next = function ($req) use ($request, $response): Response {
        expect($req)->toBe($request);

        return $response;
    };

    $result = $middleware->handle($request, $next);

    expect($result)->toBe($response);
});
