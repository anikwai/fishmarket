<?php

declare(strict_types=1);

it('has login page', function (): void {
    $page = visit('/');

    $page->assertSee('Log in to your account');
});
