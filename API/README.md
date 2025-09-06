# Subscription Manager

A comprehensive tool to track and manage all your recurring subscriptions with automated email notifications and API integrations.

## 🚀 Features

- **📊 Subscription Tracking**: Monitor all your recurring subscriptions in one dashboard
- **💰 Cost Analytics**: Track monthly and annual spending across all services
- **⏰ Smart Notifications**: Automated email reminders before renewal dates
- **🔔 Customizable Alerts**: Set personalized notification preferences
- **📱 API Integration**: RESTful API for subscription management
- **🔐 Secure Authentication**: JWT-based user authentication
- **📧 Email Service**: SendGrid and Nodemailer support
- **📈 Analytics Dashboard**: Visual insights into your subscription spending

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **SendGrid/Nodemailer** for email notifications
- **Node-cron** for scheduled tasks
- **Express-validator** for input validation

### Key Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "jsonwebtoken": "^9.0.2",
  "@sendgrid/mail": "^7.7.0",
  "nodemailer": "^6.9.4",
  "node-cron": "^3.0.2",
  "bcryptjs": "^2.4.3"
}
```

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd subscription-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/subscriptions
   JWT_SECRET=your_super_secure_jwt_secret
   
   # Email Configuration (choose one)
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=noreply@yourapp.com
   
   # OR for Gmail
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_PASS=your_app_password
   ```

4. **Start MongoDB** (make sure MongoDB is running)

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Subscriptions
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions/:id` - Get specific subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `PATCH /api/subscriptions/:id/status` - Update subscription status
- `GET /api/subscriptions/analytics/overview` - Get analytics data

### Notifications
- `GET /api/notifications/upcoming-renewals` - Get upcoming renewals
- `GET /api/notifications/history` - Get notification history
- `PUT /api/notifications/preferences` - Update notification preferences
- `POST /api/notifications/test-email` - Send test email
- `POST /api/notifications/manual-check` - Trigger manual notification check
- `GET /api/notifications/status` - Get notification service status

## 📧 Email Notifications

The system supports two email services:

### SendGrid (Recommended)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Set `EMAIL_SERVICE=sendgrid` in your `.env`
4. Add your API key and from email

### Gmail/SMTP
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password
3. Set `EMAIL_SERVICE=nodemailer` in your `.env`
4. Add your Gmail credentials

## 🔄 Automated Notifications

The system automatically checks for upcoming renewals and sends notifications:

- **Default Schedule**: Every 30 minutes
- **Default Notification Days**: 7, 3, and 1 days before renewal
- **Customizable**: Users can set their preferred notification days
- **Smart Filtering**: Prevents duplicate notifications

## 📊 Subscription Categories

- Streaming (Netflix, Spotify, etc.)
- Software (Adobe, Microsoft Office, etc.)
- Gaming (PlayStation Plus, Xbox Live, etc.)
- Fitness (Gym memberships, fitness apps)
- News & Media
- Productivity Tools
- Cloud Storage
- Security & VPN
- Education
- Shopping & E-commerce
- Finance & Banking
- Other

## 🛡️ Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Rate Limiting**: Prevents abuse with express-rate-limit
- **Input Validation**: Comprehensive validation with express-validator
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet.js**: Security headers and protection

## 🔧 Development

### Project Structure
```
subscription-manager/
├── models/           # MongoDB schemas
│   ├── User.js
│   └── Subscription.js
├── routes/           # API route handlers
│   ├── auth.js
│   ├── subscriptions.js
│   └── notifications.js
├── services/         # Business logic
│   └── notificationService.js
├── middleware/       # Custom middleware
│   └── auth.js
├── server.js         # Main application file
├── package.json
└── README.md
```

### Running Tests
```bash
# Add your test commands here
npm test
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/subscriptions` |
| `JWT_SECRET` | JWT signing secret | Required |
| `EMAIL_SERVICE` | Email service provider | `sendgrid` |
| `NOTIFICATION_CHECK_INTERVAL` | Cron pattern for notifications | `*/30 * * * *` |
| `DAYS_BEFORE_RENEWAL` | Days to send notifications | `7,3,1` |

## 🚀 Deployment

### Heroku
1. Create a Heroku app
2. Add MongoDB Atlas database
3. Set environment variables in Heroku dashboard
4. Deploy with Git:
   ```bash
   git push heroku main
   ```

### Docker (Optional)
```dockerfile
# Add Dockerfile for containerization
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@subscriptionmanager.com

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Stripe/PayPal API integration
- [ ] Browser extension for auto-detection
- [ ] Expense analytics with charts
- [ ] Shared family subscriptions
- [ ] Cancellation assistance
- [ ] Price change notifications
- [ ] Subscription recommendations

---

Made with ❤️ for better subscription management
