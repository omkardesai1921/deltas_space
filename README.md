# 🚀 Campus Share - File Transfer & Storage Platform

A secure, scalable file transfer and storage web application designed for college students to share files, photos, videos, and text between devices.

## 📋 Project Overview

**Campus Share** solves the common problem of transferring files between mobile devices and college PCs without relying on WhatsApp, email, or USB drives.

### Key Features
- 📁 **Folder-based File Management** - Organize files in custom folders
- 📝 **Text Clipboard** - Share text snippets with 1-click copy
- ⏰ **Auto-Delete (7 Days)** - Automatic cleanup of old files
- 🔐 **Secure Authentication** - OTP signup + username/password login
- 👨‍💼 **Admin Panel** - Monitor usage and manage users
- 📱 **Mobile-Friendly** - Responsive design for all devices
- 🛡️ **Security First** - Rate limiting, file validation, JWT auth

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcrypt + OTP |
| File Storage | Local Storage (with cloud option) |
| Email/OTP | Nodemailer + Gmail SMTP |
| Scheduling | node-cron (auto-delete) |

## 📁 Folder Structure

```
campus-share/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context (Auth, Theme)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # CSS styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js Backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Custom middleware
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   ├── uploads/               # File storage directory
│   ├── server.js              # Entry point
│   └── package.json
│
├── .env.example               # Environment variables template
├── docker-compose.yml         # Docker configuration (optional)
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- Gmail account (for OTP)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd campus-share
```

2. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend**
```bash
cd client
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  isVerified: Boolean,
  isAdmin: Boolean,
  isBanned: Boolean,
  storageUsed: Number,
  storageLimit: Number,
  createdAt: Date,
  lastLogin: Date
}
```

### Files Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  originalName: String,
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  folderId: ObjectId (ref: Folder),
  expiresAt: Date,
  downloads: Number,
  createdAt: Date
}
```

### Folders Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  parentId: ObjectId (ref: Folder),
  createdAt: Date
}
```

### Clipboards Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  expiresAt: Date,
  createdAt: Date
}
```

### OTP Collection
```javascript
{
  _id: ObjectId,
  email: String,
  otp: String (hashed),
  expiresAt: Date,
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | Get user's files |
| POST | `/api/files/upload` | Upload file(s) |
| GET | `/api/files/:id/download` | Download file |
| DELETE | `/api/files/:id` | Delete file |

### Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | Get user's folders |
| POST | `/api/folders` | Create folder |
| PUT | `/api/folders/:id` | Rename folder |
| DELETE | `/api/folders/:id` | Delete folder |

### Clipboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clipboard` | Get user's clips |
| POST | `/api/clipboard` | Create clip |
| DELETE | `/api/clipboard/:id` | Delete clip |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/stats` | Get system stats |
| PUT | `/api/admin/users/:id/ban` | Ban/Unban user |
| DELETE | `/api/admin/users/:id` | Delete user |

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiry
- ✅ HTTP-only cookies for token storage
- ✅ Rate limiting (100 requests/15 min)
- ✅ File type validation (whitelist)
- ✅ File size limit (50MB per file)
- ✅ Storage quota per user (500MB)
- ✅ Input sanitization
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ XSS protection

## 👥 Test Users

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@campus.edu | Admin@123 | Admin |
| testuser1 | test1@campus.edu | Test@123 | User |
| testuser2 | test2@campus.edu | Test@123 | User |

## 📦 Deployment

### Free Hosting Options
- **Frontend**: Vercel, Netlify
- **Backend**: Render, Railway
- **Database**: MongoDB Atlas (free tier)

See `DEPLOYMENT.md` for detailed instructions.

## 📄 License

MIT License - feel free to use for your college project!

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

---

Built with ❤️ for college students
