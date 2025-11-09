# Fish Market Management System

A comprehensive business management application for fish market operations. Manage suppliers, customers, purchases, sales, expenses, payments, and generate detailed reports and receipts.

## Features

- Dashboard with sales and purchase analytics
- Supplier management
- Customer management with contact information
- Purchase tracking from suppliers
- Sales management with cash and credit options
- Expense tracking and categorization
- Payment processing for credit sales
- Receipt generation and email delivery
- Comprehensive reporting system including:
  - Sales Summary
  - Sales by Customer
  - Profit & Loss
  - Outstanding Credits
  - Expense Reports
  - Purchase Reports
  - Stock Reports
  - Customer Reports
  - Supplier Reports
- PDF receipt generation
- CSV export functionality

## Technology Stack

- Backend: Laravel 12
- Frontend: React 19 with Inertia.js
- Database: PostgreSQL (configurable)
- PDF Generation: DomPDF
- Styling: Tailwind CSS
- UI Components: Radix UI and shadcn/ui
- Testing: Pest PHP

## Requirements

- PHP 8.4 or higher
- Composer
- Node.js and npm
- PostgreSQL database (or MySQL/SQLite)
- Web server (Apache/Nginx) or PHP built-in server

## Installation

1. Clone the repository
2. Install PHP dependencies:
   ```
   composer install
   ```
3. Install Node.js dependencies:
   ```
   npm install
   ```
4. Copy the environment file:
   ```
   cp .env.example .env
   ```
5. Generate application key:
   ```
   php artisan key:generate
   ```
6. Configure your database in the `.env` file
7. Run migrations:
   ```
   php artisan migrate
   ```
8. Build frontend assets:
   ```
   npm run build
   ```
9. Start the development server:
   ```
   composer run dev
   ```

## Usage

After installation, access the application through your web browser. The default route is `/` which redirects to the dashboard for authenticated users.

### Key Functionality

- Create and manage suppliers and customers
- Record purchases from suppliers to track inventory
- Record sales transactions (cash or credit)
- Track expenses by category
- Process payments for credit sales
- Generate and download receipts as PDF
- Email receipts directly to customers
- View comprehensive business reports
- Export report data as CSV

## Project Structure

- `app/` - Laravel application code
  - `Actions/` - Business logic actions
  - `Http/Controllers/` - Request handlers
  - `Models/` - Eloquent models
  - `Mail/` - Email templates and classes
- `resources/` - Frontend resources
  - `js/` - React components and pages
  - `views/` - Blade templates (receipts, emails)
  - `css/` - Stylesheets
- `database/` - Migrations, seeders, factories
- `public/` - Public assets including logo
- `tests/` - Pest test files

## Company Information

TZ HOLDING LIMITED
20231076
P O Box 407, Honiara, Solomon Islands

## License

MIT License

## Support

For issues or questions, please contact the development team.

