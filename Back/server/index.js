import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import config, { validateConfig } from "./config/config.js";
import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import dashboardRoutes from "./routes/dashboard.js";
import notificationRoutes from "./routes/notifications.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

// Validate configuration
try {
  validateConfig();
  logger.info("✅ Configuration validation passed");
} catch (error) {
  logger.error("❌ Configuration validation failed:", error.message);
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy (important for rate limiting behind reverse proxies)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.api.rateLimit.windowMs,
  max: config.api.rateLimit.max,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil(config.api.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(config.api.rateLimit.windowMs / 1000),
    });
  },
});
app.use(limiter);

// Auth rate limiting (more restrictive)
const authLimiter = rateLimit({
  windowMs: config.api.authRateLimit.windowMs,
  max: config.api.authRateLimit.max,
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: Math.ceil(config.api.authRateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: Math.ceil(config.api.authRateLimit.windowMs / 1000),
    });
  },
});

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (config.security.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, allow any localhost origin
      if (config.server.nodeEnv === "development" && origin.includes("localhost")) {
        return callback(null, true);
      }
      
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (config.server.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint (before rate limiting for monitoring)
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to SubTrackr API",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path} from IP: ${req.ip}`);
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
  logger.info(`📧 Email service: ${config.email.user ? 'Configured' : 'Not configured'}`);
  logger.info(`🔗 Frontend URL: ${config.server.frontendUrl}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info("HTTP server closed");
    
    // Close database connection
    import("mongoose").then((mongoose) => {
      mongoose.connection.close(() => {
        logger.info("MongoDB connection closed");
        process.exit(0);
      });
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 30000);
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle process termination
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
