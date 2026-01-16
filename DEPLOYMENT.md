# Deployment Guide - Campus Share

## Free Hosting Options

### 1. Database (MongoDB Atlas - Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account → Create free cluster
3. Add database user with password
4. Add IP `0.0.0.0/0` to Network Access
5. Get connection string from "Connect" → "Connect your application"
6. Use in `MONGODB_URI` env variable

### 2. Backend (Render - Free)
1. Go to [render.com](https://render.com)
2. Connect GitHub repo
3. Create "Web Service" → Select server folder
4. Settings:
   - Build: `npm install`
   - Start: `npm start`
   - Environment: Add all env variables from .env
5. Deploy

### 3. Frontend (Vercel - Free)
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Root: `client`
4. Build: `npm run build`
5. Output: `dist`
6. Add `VITE_API_URL` env variable pointing to Render backend

### Quick Start (Local)
```bash
# Terminal 1 - Start MongoDB (if local)
mongod

# Terminal 2 - Backend
cd server
npm install
npm run seed  # Create admin user
npm run dev

# Terminal 3 - Frontend
cd client
npm install
npm run dev
```

### Test Accounts
- Admin: admin@campus.edu / Admin@123
- User: test1@campus.edu / Test@123

### Security Checklist
- ✅ Change JWT_SECRET to long random string
- ✅ Use app password for Gmail SMTP
- ✅ Set proper CORS origin in production
- ✅ Enable HTTPS in production
