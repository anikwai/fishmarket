<?php

declare(strict_types=1);

it('has login page', function (): void {
    $response = $this->get(route('login'));

    $response->assertOk();
});
