# Quick Start Guide

## Starting the Application

Simply run:

```bash
npm run dev
```

This command will automatically start BOTH servers:
- Backend API server on port 3001
- Frontend development server on port 5173

Alternatively, you can run them separately:

### Terminal 1: Backend API Server
```bash
npm run dev:server
```

### Terminal 2: Frontend Development Server
```bash
npm run dev:frontend
```

## Access the Application

Once both servers are running, open your browser to:
**http://localhost:5173**

## First Steps

1. **Add a Cost Entry**
   - Click "Cost Entries" in the navigation
   - Click "Add Cost Entry"
   - Enter product details (SKU: TEST-001, Title: Test Product, etc.)
   - Set a unit cost and quantity
   - Submit the form

2. **Record a Sale**
   - Click "Products" in the navigation
   - Click "Add Sale"
   - Select the product you just created
   - Enter quantity and sale price
   - Submit the form

3. **View Analytics**
   - Click "Dashboard" to see your metrics
   - Revenue, COGS, Profit, and Margin will be calculated automatically

## Troubleshooting

**"Failed to fetch" errors:**
- Make sure the backend server is running (Terminal 1)
- Check that it's running on port 3001

**"User ID required" errors:**
- The demo user ID is hardcoded in the frontend API client
- No authentication setup is needed for the MVP

**Build errors:**
- Run `npm install` to ensure all dependencies are installed
- Check that you're using Node.js 18 or higher
