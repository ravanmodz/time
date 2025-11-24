# SmartTrack HR – Advanced Time & Attendance Web Platform

A comprehensive Time & Attendance Management System built with Next.js, MongoDB, and real-time features.

## Features

- **Multi-role System**: Super Admin, Admin/HR, and Employee roles
- **Real-time Tracking**: Server-Sent Events for live updates
- **Geo-location**: GPS tracking with reverse geocoding (OpenCage API)
- **Photo Verification**: Selfie upload for check-in/check-out
- **Leave Management**: Complete leave application and approval system
- **Reports & Export**: Excel and CSV exports
- **Responsive UI**: Modern design with Tailwind CSS
- **Shift Management**: Create and assign shifts to employees
- **Attendance Correction**: Request and approve attendance corrections

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Real-time**: Server-Sent Events (SSE)
- **Charts**: Recharts
- **Icons**: React Icons

## Setup Instructions

### Local Development

1. **Clone and Install**:
```bash
cd smarttrack-hr
npm install
```

2. **Set up MongoDB**:
   - Create a MongoDB database (local or MongoDB Atlas)
   - Get your connection string

3. **Create `.env.local` file**:
```env
MONGODB_URI=mongodb://localhost:27017/smarttrack-hr
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smarttrack-hr

JWT_SECRET=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_OPENCAGE_KEY=your-opencage-api-key-optional
```

4. **Seed the database** (creates default users):
```bash
# After starting the dev server, visit:
# http://localhost:3000/api/seed
# OR use curl:
curl -X POST http://localhost:3000/api/seed
```

5. **Run development server**:
```bash
npm run dev
```

6. **Access the application**:
   - Open http://localhost:3000
   - Login with default credentials (see below)

## Deployment on Vercel

### Step 1: Prepare Your Code
1. Push your code to a GitHub repository

### Step 2: Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./smarttrack-hr` (if your repo root is different)

### Step 3: Add Environment Variables
In Vercel project settings, add these environment variables:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
NEXT_PUBLIC_OPENCAGE_KEY=your-opencage-api-key-optional
```

**Important**: 
- Use MongoDB Atlas (cloud) for production, not local MongoDB
- Use a strong, random JWT_SECRET
- Update NEXT_PUBLIC_API_URL to your Vercel deployment URL

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Visit your deployed URL

### Step 5: Seed Database
After deployment, seed the database by calling:
```
POST https://your-project.vercel.app/api/seed
```

You can use:
- Postman
- curl: `curl -X POST https://your-project.vercel.app/api/seed`
- Or create a simple button in your app (for first-time setup only)

## Default Credentials (After Seeding)

- **Super Admin**: 
  - Email: `admin@smarttrack.com`
  - Password: `admin123`

- **HR Manager**: 
  - Email: `hr@smarttrack.com`
  - Password: `hr123`

- **Employee**: 
  - Email: `employee@smarttrack.com`
  - Password: `employee123`

**⚠️ Important**: Change these passwords immediately after first login in production!

## Project Structure

```
smarttrack-hr/
├── pages/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── attendance/   # Attendance endpoints
│   │   ├── admin/        # Admin endpoints
│   │   ├── leaves/       # Leave management
│   │   └── shifts/      # Shift management
│   ├── employee/         # Employee pages
│   └── admin/            # Admin/HR pages
├── components/           # React components
├── models/              # MongoDB models
├── lib/                 # Utilities and helpers
├── hooks/               # React hooks
└── styles/              # Global styles
```

## Features Overview

### Employee Features
- ✅ Check-in/Check-out with location and photo
- ✅ View attendance history
- ✅ Request attendance corrections
- ✅ Apply for leave
- ✅ View leave status
- ✅ View profile

### Admin/HR Features
- ✅ Dashboard with real-time stats
- ✅ Employee management (CRUD)
- ✅ View all attendance records
- ✅ Approve/reject leave applications
- ✅ Approve/reject attendance corrections
- ✅ Export reports (Excel/CSV)
- ✅ Shift management
- ✅ View currently working employees

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Admin only)
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/status` - Get today's status
- `GET /api/attendance/history` - Get attendance history
- `POST /api/attendance/correction` - Request correction
- `PATCH /api/attendance/correction` - Approve/reject correction

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/employees` - List employees
- `PUT /api/admin/employees` - Update employee
- `DELETE /api/admin/employees` - Deactivate employee

### Leaves
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves/list` - List leaves
- `PATCH /api/leaves/approve` - Approve/reject leave

### Reports
- `GET /api/reports/export` - Export attendance report

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB URI is correct
- For MongoDB Atlas, whitelist your IP address
- Check network connectivity

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET is set correctly
- Verify token expiration

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)
- Clear `.next` folder and rebuild

## License

This project is open source and available for use.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

