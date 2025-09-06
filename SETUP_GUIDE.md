# 🚀 SubTrackr Setup Guide

Welcome to SubTrackr! This guide will help you set up the complete subscription tracking application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (local installation) - [Download here](https://www.mongodb.com/try/download/community)
  - Alternative: Use MongoDB Atlas (cloud database)
- **Git** - [Download here](https://git-scm.com/)

## 🏗️ Architecture Overview

SubTrackr consists of multiple components:

```
SubTrackr/
├── Back/server/          # Main backend API (Port 5000)
├── API/                  # Notification service API (Port 5001)
├── Front/                # Next.js frontend (Port 3000)
└── scripts/              # Setup and utility scripts
```

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd SubTrackr
   npm run install:all
   ```

2. **Run the setup script**:
   ```bash
   npm run setup:env
   ```
   
   This interactive script will:
   - Create environment files
   - Configure database connection
   - Set up email service
   - Generate secure JWT secrets

3. **Start all services**:
   ```bash
   npm run dev
   ```

4. **Test the setup**:
   ```bash
   npm run test:integration
   ```

### Option 2: Manual Setup

#### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd Back/server && npm install && cd ../..

# Install frontend dependencies
cd Front && npm install && cd ..

# Install API dependencies
cd API && npm install && cd ..
```

#### Step 2: Environment Configuration

1. **Backend Configuration**:
   ```bash
   cd Back/server
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/subtrackr
   JWT_SECRET=your_secure_jwt_secret_here
   
   # Email Configuration (choose one)
   # For Gmail:
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # For SendGrid:
   # EMAIL_SERVICE=sendgrid
   # SENDGRID_API_KEY=your_sendgrid_api_key
   # SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   
   FRONTEND_URL=http://localhost:3000
   ```

2. **API Service Configuration**:
   ```bash
   cd API
   cp .env.example .env
   ```
   
   Edit `.env` with similar configuration (different port):
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/subscriptions
   JWT_SECRET=your_secure_jwt_secret_here
   CLIENT_URL=http://localhost:3000
   
   # Email configuration (same as backend)
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

#### Step 3: Database Setup

**Option A: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # On macOS with Homebrew:
   brew services start mongodb-community
   
   # On Windows:
   net start MongoDB
   
   # On Linux:
   sudo systemctl start mongod
   ```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist your IP address
5. Get connection string and update `MONGODB_URI` in your `.env` files

#### Step 4: Email Service Setup

**Option A: Gmail (Development)**
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Use generated password in `EMAIL_PASS`

**Option B: SendGrid (Production)**
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key with "Full Access"
3. Verify sender email address
4. Update `.env` with API key and sender email

## 🚀 Running the Application

### Development Mode

**All services together** (Recommended):
```bash
npm run dev
```

**Individual services**:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# API service only
npm run dev:api

# All services including API
npm run dev:all
```

### Production Mode

```bash
# Build frontend
npm run build

# Start production servers
npm start
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start backend and frontend
- `npm run dev:all` - Start all services (backend + API + frontend)
- `npm run setup:env` - Interactive environment setup

### Testing
- `npm run test:integration` - Run integration tests
- `npm run check` - Basic health check
- `npm run check:health` - Detailed health check

### Maintenance
- `npm run install:all` - Install all dependencies
- `npm run clean` - Clean node_modules and logs
- `npm run security:audit` - Security audit
- `npm run update:deps` - Update dependencies

## 📱 Application URLs

Once running, access the application at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Notification API**: http://localhost:5001

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Find process using port
   lsof -i :5000  # or :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity (for Atlas)

3. **Email Not Working**:
   - Verify email credentials
   - Check spam folder
   - Enable "Less secure app access" for Gmail (not recommended for production)

4. **JWT Token Issues**:
   - Ensure JWT_SECRET is set and identical across services
   - Clear browser localStorage
   - Check token expiration

### Debugging

**View logs**:
```bash
# Backend logs
tail -f Back/server/combined.log

# API logs
tail -f API/combined.log
```

**Enable debug mode**:
```bash
# Set in .env
NODE_ENV=development
LOG_LEVEL=debug
```

## 🔒 Security Considerations

### Development
- Use strong JWT secrets (generated automatically by setup script)
- Never commit `.env` files to version control
- Use app passwords for email services

### Production
- Use environment variables instead of `.env` files
- Enable HTTPS
- Use production database credentials
- Configure CORS properly
- Set up monitoring and logging

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Subscription Endpoints
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Dashboard Endpoints
- `GET /api/dashboard/summary` - Dashboard statistics
- `GET /api/dashboard/upcoming-renewals` - Upcoming renewals

### Notification Endpoints
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/test-email` - Send test email
- `PUT /api/notifications/:id/mark-read` - Mark as read

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:integration`
5. Submit a pull request

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Run the integration test: `npm run test:integration`
3. Check the logs for error messages
4. Open an issue with detailed error information

## 🎉 Next Steps

After successful setup:

1. Create your first user account
2. Add sample subscriptions
3. Test email notifications
4. Explore the dashboard features
5. Set up automated backups (production)

---

**Happy tracking! 🎯**
