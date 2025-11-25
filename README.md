# Fish Market Management System

[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php)](https://www.php.net)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A full-stack business management system for fish market operations with role-based access control, real-time analytics, and automated invoicing.

## Features

**Core Operations**
- Supplier & customer management with contact tracking
- Purchase and sales processing (cash/credit with delivery options)
- Real-time inventory tracking with stock levels
- Multi-category expense management (shipping, ice, other)
- Payment processing with automatic balance calculations
- PDF receipt/invoice generation with email delivery

**Financial Reporting**
- Sales Summary, Profit & Loss, Outstanding Credits
- Customer, Supplier, Purchase, Stock, and Expense reports
- Date range filtering with CSV export

**Security & Access**
- Role-based permissions (Admin, Manager, Cashier)
- Email verification & two-factor authentication (2FA)
- Google OAuth integration with encrypted token storage

## Tech Stack

**Backend:** Laravel 12, PHP 8.4, Spatie Permissions, Fortify, Socialite, DomPDF
**Frontend:** React 19, TypeScript, Inertia.js v2, Tailwind CSS 4, shadcn/ui, Recharts
**Database:** SQLite (default), PostgreSQL, MySQL
**Testing:** Pest PHP v4 with browser testing
**Build:** Vite 7, ESLint, Prettier

## Quick Start

```bash
# Install dependencies
composer install && npm install

# Configure environment
cp .env.example .env
php artisan key:generate

# Setup database
php artisan migrate --seed

# Start development server
composer run dev  # Runs server, queue, logs, and Vite concurrently
```

Access at `http://localhost:8000`. Default admin credentials are seeded.

## Requirements

- PHP 8.4+, Composer
- Node.js 18+, npm
- SQLite/PostgreSQL/MySQL

## Architecture

This application uses Laravel's Action pattern for business logic isolation. All core operations (`CreateSale`, `GenerateReceipt`, `ProcessPayment`, etc.) are encapsulated in reusable Action classes with dependency injection.

**Key Directories:**
- `app/Actions/` - 48 business logic classes
- `app/Http/Controllers/` - Request handlers (thin controllers)
- `resources/js/Pages/` - React/Inertia page components
- `tests/` - Feature, Unit, and Browser tests

## Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/SaleControllerTest.php

# Run with filter
php artisan test --filter=CreateSaleTest
```

## Developer & Maintainer

**Anikwai** - [@anikwai](https://github.com/anikwai)

## License

MIT License - TZ HOLDING LIMITED (20231076)
P O Box 407, Honiara, Solomon Islands

