# Shopify COGS Tracking SaaS

A production-ready Cost of Goods Sold (COGS) tracking application for Shopify merchants using FIFO inventory accounting.

## Features

- **Cost Entry Management**: Track product costs including unit price, freight, and duties
- **FIFO Calculation**: Automatic First-In-First-Out inventory cost calculation
- **Sales Tracking**: Record sales and automatically calculate COGS and profit margins
- **Dashboard Analytics**: Real-time metrics for revenue, COGS, profit, and margins
- **Product Analytics**: Detailed profit analysis by product with visual indicators
- **Sample Data**: Pre-loaded with demo products and transactions to showcase functionality

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **Validation**: Zod schemas

## Prerequisites

- Node.js 18+ and npm
- Supabase account (database already provisioned)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env` file should already contain your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The database schema has already been created with the following tables:
- `users` - User accounts
- `products` - Product catalog
- `cost_entries` - Purchase cost records with FIFO tracking
- `sales` - Sales transactions with calculated COGS

**Sample Data Included:**
The database comes pre-populated with demo data:
- 3 Products: Premium Cotton T-Shirt, Ceramic Coffee Mug, Silicone Phone Case
- 5 Cost Entries: Multiple inventory purchases with varying costs
- 3 Sales: Sample transactions demonstrating FIFO calculation and profit tracking

This allows you to immediately see the dashboard populated with realistic metrics.

### 4. Run the Application

Simply run:
```bash
npm run dev
```

This automatically starts both the backend and frontend servers:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

Alternatively, run them separately:
- Backend: `npm run dev:server`
- Frontend: `npm run dev:frontend`

## Usage Guide

### Adding Cost Entries

1. Navigate to "Cost Entries" page
2. Click "Add Cost Entry"
3. Fill in the form:
   - **SKU**: Product identifier
   - **Product Title**: Name of the product
   - **Supplier Name**: Vendor or supplier
   - **Unit Cost**: Base cost per unit
   - **Quantity**: Number of units purchased
   - **Freight per Unit** (optional): Shipping cost per unit
   - **Duty per Unit** (optional): Import duties per unit
   - **Entry Date**: Purchase date
   - **Invoice Reference** (optional): Invoice number

The system automatically calculates the total landed cost per unit.

### Recording Sales

1. Navigate to "Products" page
2. Click "Add Sale"
3. Select the product SKU from the dropdown
4. Enter quantity, sale price, and date
5. Submit the form

The system will:
- Use FIFO to calculate COGS from available inventory
- Update remaining inventory quantities
- Calculate gross profit and margin
- Display error if insufficient inventory

### Viewing Analytics

**Dashboard** shows:
- Total Revenue, COGS, Profit, and Margin percentage
- Top 5 products by profit
- Bottom 5 products by profit

**Products** page shows:
- All products with detailed metrics
- Units sold, revenue, COGS, profit, and margin
- Color-coded margin indicators (green > 30%, yellow > 15%, red < 15%)

## API Endpoints

### Cost Entries
- `POST /api/cost-entries` - Create a new cost entry
- `GET /api/cost-entries` - List all cost entries

### Sales
- `POST /api/sales/sync` - Record a new sale

### Analytics
- `GET /api/dashboard` - Get dashboard metrics
- `GET /api/products` - Get product profit metrics

### Request Headers
All requests require the `x-user-id` header (currently set to demo user).

## FIFO Logic Explanation

When a sale is recorded:

1. System fetches all cost entries for the product SKU ordered by entry date (oldest first)
2. Calculates available inventory from `quantity_remaining` field
3. Validates sufficient inventory exists
4. Consumes inventory from oldest entries first until sale quantity is fulfilled
5. Calculates weighted average COGS based on consumed inventory
6. Updates `quantity_remaining` for affected cost entries
7. Stores calculated COGS and profit with the sale record

Example:
- Cost Entry 1: 100 units at $10 (Jan 1)
- Cost Entry 2: 100 units at $12 (Feb 1)
- Sale: 150 units
- COGS: (100 × $10 + 50 × $12) / 150 = $10.67 per unit

## Data Validation

- All cost and price fields must be non-negative
- Quantities must be positive integers
- SKU must exist before recording sales
- Sufficient inventory must be available for sales
- All dates and required fields validated with Zod schemas

## Future Enhancements

- Shopify OAuth integration
- Automatic order synchronization
- Invoice parsing with OCR
- CSV import/export
- Multi-user support and team management
- Advanced reporting and charts
- Inventory alerts and notifications

## Production Deployment Notes

- Add proper authentication system (replace demo user)
- Implement user registration and login
- Add API rate limiting
- Set up proper environment variable management
- Configure CORS for production domain
- Add logging and monitoring
- Implement backup and recovery procedures
- Add comprehensive error handling

## License

MIT
