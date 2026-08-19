# Mobile Shop POS - Setup & Architecture Guide

Mobile Shop POS is a fast, modern Point of Sale and store management system built with React, Tailwind CSS, and Supabase / PostgreSQL.

---

## 1. Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React
- **Backend / Database:** Supabase (PostgreSQL 15+), Realtime, Row Level Security, RPC Transaction Functions

---

## 2. Supabase Database Setup

1. Create a new project in your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository.
4. Copy and run the entire SQL script:
   - Sets up all tables (`products`, `categories`, `sales`, `sale_items`, `payments`, `suppliers`, `purchases`, `expenses`, `notifications`, `settings`, `access_credentials`, `activity_logs`).
   - Creates the `complete_sale_rpc` and `verify_user_login_rpc` atomic database functions.
   - Inserts the default admin and cashier credentials and settings.

---

## 3. Configuration & Development

1. In the project root directory, create your `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. Install dependencies & run development server:
```bash
npm install
npm run dev
```

The application will run at `http://localhost:5173`.

---

## 4. Default Login Credentials

- **Admin Account:**
  - Email: `admin@mobileshop.com`
  - Password: `admin123`
  - Access: Full store management, settings, reports, stock adjustments, supplier bills, user management.

- **Cashier Account:**
  - Email: `cashier@mobileshop.com`
  - Password: `cashier123`
  - Access: POS billing, receipt printing, held sales, sales history.

---

## 5. Production Build

To build the application for production:
```bash
npm run build
```
