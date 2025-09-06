# SubTrackr - Subscription Management System

*Built for MindSprint Hackathon*

A full-stack subscription tracking application built with Next.js (frontend) and Node.js/Express (backend).

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Option 1: Run Both Servers Together (Recommended)

1. Install concurrently globally (optional):
   ```bash
   npm install -g concurrently
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install all project dependencies:
   ```bash
   npm run install:all
   ```

4. Start both servers:
   ```bash
   npm run dev
   ```

### Option 2: Run Servers Separately

#### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd Back/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create/update `.env` file with your MongoDB connection:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

#### Frontend Setup
1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd Front
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the frontend server:
   ```bash
   npm run dev
   ```

### Option 3: Windows PowerShell Script
If you're on Windows, you can use the PowerShell script:
```powershell
.\start-dev.ps1
```

## 🌐 Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000 (basic endpoint info)

## 📁 Project Structure

```
SubTrackr/
├── Back/                   # Backend (Node.js/Express)
│   └── server/
│       ├── config/         # Database configuration
│       ├── middleware/     # Authentication & validation
│       ├── models/         # MongoDB models
│       ├── routes/         # API routes
│       ├── scripts/        # Utility scripts
│       ├── utils/          # Helper functions
│       └── index.js        # Server entry point
├── Front/                  # Frontend (Next.js)
│   ├── app/               # Next.js app directory
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── public/           # Static assets
└── package.json          # Root package.json for scripts
```

## 🔧 Features Integration

### Authentication
- Login/Register forms connect to backend API
- JWT token management
- Protected routes
- User session persistence

### Dashboard
- Real-time subscription data
- CRUD operations for subscriptions
- Statistics and analytics
- Responsive design

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `GET /api/dashboard/stats` - Dashboard statistics

## 🔒 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/subtrackr
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 Development Notes

### Frontend-Backend Integration
- CORS configured for development
- API client with authentication headers
- Error handling and loading states
- Type-safe API calls with TypeScript

### Authentication Flow
1. User logs in through frontend form
2. Frontend sends credentials to backend
3. Backend validates and returns JWT token
4. Frontend stores token and redirects to dashboard
5. Subsequent API calls include token in headers

## 🚀 Deployment

### Backend Deployment
- Configure production MongoDB URI
- Set JWT_SECRET to a secure value
- Update FRONTEND_URL to production domain
- Deploy to services like Heroku, Railway, or DigitalOcean

### Frontend Deployment
- Update NEXT_PUBLIC_API_URL to production backend URL
- Build the application: `npm run build`
- Deploy to Vercel, Netlify, or similar services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the integration
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
