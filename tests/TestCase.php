<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Setup the test database after refreshing.
     */
    protected function afterRefreshingDatabase()
    {
        // Clear permission cache before seeding
        if (class_exists(\Spatie\Permission\PermissionRegistrar::class)) {
            app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }

        // Seed the database
        $this->seed();
    }
}
