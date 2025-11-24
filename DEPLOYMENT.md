# Deployment Guide for Vercel

## Quick Start

### 1. Prerequisites
- GitHub account
- MongoDB Atlas account (free tier works)
- Vercel account (free tier works)

### 2. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP address (0.0.0.0/0 for all IPs - development only)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 4. Deploy to Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework: Next.js
   - Root Directory: Leave empty (or `smarttrack-hr` if needed)
5. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=generate-a-random-secret-key
   NEXT_PUBLIC_API_URL=https://your-app.vercel.app
   ```
6. Click "Deploy"

### 5. Seed Database
After deployment, seed the database:
```bash
curl -X POST https://your-app.vercel.app/api/seed
```

Or use Postman/Thunder Client to POST to `/api/seed`

### 6. Access Your App
Visit: `https://your-app.vercel.app`

Login with:
- admin@smarttrack.com / admin123
- hr@smarttrack.com / hr123
- employee@smarttrack.com / employee123

## Important Notes

1. **MongoDB Atlas**: Use cloud MongoDB, not local
2. **JWT_SECRET**: Use a strong random string (at least 32 characters)
3. **Environment Variables**: Never commit `.env.local` to Git
4. **HTTPS**: Vercel provides HTTPS automatically
5. **File Uploads**: Currently using base64. For production, consider cloud storage (AWS S3, Cloudinary)

## Custom Domain (Optional)
1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Monitoring
- Vercel provides built-in analytics
- Check function logs in Vercel dashboard
- Monitor MongoDB Atlas metrics

## Updates
After pushing to GitHub, Vercel automatically redeploys!

