import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

// Configuration object with defaults and validation
const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/subtrackr",
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
    expiresIn: process.env.JWT_EXPIRE || "30d",
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
  },

  // API Configuration
  api: {
    notificationUrl: process.env.NOTIFICATION_API_URL || "http://localhost:5001/api",
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    },
    authRateLimit: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    },
  },

  // Notification Configuration
  notifications: {
    checkInterval: process.env.NOTIFICATION_CHECK_INTERVAL || "0 9 * * *", // Daily at 9 AM
    reminderDays: process.env.DAYS_BEFORE_RENEWAL 
      ? process.env.DAYS_BEFORE_RENEWAL.split(",").map(d => parseInt(d.trim()))
      : [7, 3, 1],
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    corsOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:3000"],
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "combined.log",
    errorFile: process.env.ERROR_LOG_FILE || "error.log",
  },
};

// Validation function to check required environment variables
export const validateConfig = () => {
  const requiredVars = [
    { key: "MONGODB_URI", value: config.database.uri },
    { key: "JWT_SECRET", value: config.jwt.secret },
  ];

  const missingVars = requiredVars.filter(
    ({ value }) => !value || value === "fallback_secret_key_change_in_production"
  );

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(({ key }) => console.error(`   - ${key}`));
    
    if (config.server.nodeEnv === "production") {
      throw new Error("Required environment variables are missing in production");
    } else {
      console.warn("⚠️  Using default values for missing environment variables in development");
    }
  }

  // Warn about email configuration
  if (!config.email.user || !config.email.pass) {
    console.warn("⚠️  Email configuration is incomplete. Email functionality will be disabled.");
  }

  return true;
};

// Get configuration for specific environment
export const getConfig = (env = process.env.NODE_ENV) => {
  const envConfig = { ...config };
  
  // Environment-specific overrides
  if (env === "test") {
    envConfig.database.uri = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/subtrackr_test";
    envConfig.logging.level = "error";
  }
  
  if (env === "production") {
    // Production-specific configurations
    envConfig.security.corsOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(",")
      : [envConfig.server.frontendUrl];
  }

  return envConfig;
};

export default config;
