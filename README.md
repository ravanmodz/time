# Billing Management System - Next.js

A modern billing management system for commercial buildings built with Next.js 14, React, Tailwind CSS, and MongoDB.

## Features

- 📊 Dashboard with analytics
- 🏢 Building, Floor & Shop Management
- 👥 Tenant Management
- 💰 Bill Creation & Payment Tracking
- 📥 Excel Import/Export
- 🔐 Authentication with NextAuth

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** MongoDB (Mongoose)
- **Auth:** NextAuth.js
- **Icons:** Lucide React
- **Charts:** Recharts

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` file:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

## Deploy on Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## Default Login

- Username: `owner`
- Password: `admin123`
