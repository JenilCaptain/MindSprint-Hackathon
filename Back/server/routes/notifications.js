import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";
import Subscription from "../models/Subscription.js";
import notificationBridge from "../services/notificationBridge.js";
import logger from "../utils/logger.js";

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
router.get("/", protect, async (req, res, next) => {
  try {
    logger.info(`Fetching notifications for user: ${req.user._id}`);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user._id })
      .populate('subscriptionId', 'serviceName cost billingCycle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId: req.user._id });

    logger.info(`Found ${notifications.length} notifications for user ${req.user._id}`);

    res.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
router.get("/unread-count", protect, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      status: "pending"
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/:id/mark-read
// @desc    Mark notification as read
router.put("/:id/mark-read", protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: "sent" },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    logger.info(`Notification marked as read: ${req.params.id} by user: ${req.user._id}`);
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
router.put("/mark-all-read", protect, async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, status: "pending" },
      { status: "sent" }
    );

    logger.info(`${result.modifiedCount} notifications marked as read for user: ${req.user._id}`);
    res.json({ 
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    logger.info(`Notification deleted: ${req.params.id} by user: ${req.user._id}`);
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/notifications/test-email
// @desc    Send test email
router.post("/test-email", protect, async (req, res, next) => {
  try {
    const { type = 'test' } = req.body;
    
    const result = await notificationBridge.sendTestEmail(req.user.email, type);
    
    if (result.success) {
      logger.info(`Test email sent to ${req.user.email} by user: ${req.user._id}`);
      res.json({ 
        message: "Test email sent successfully",
        details: result.message 
      });
    } else {
      res.status(500).json({ 
        message: "Failed to send test email",
        error: result.error 
      });
    }
  } catch (error) {
    logger.error("Test email error:", error);
    next(error);
  }
});

// @route   POST /api/notifications/create-samples
// @desc    Create sample notifications for testing
router.post("/create-samples", protect, async (req, res, next) => {
  try {
    logger.info(`Creating sample notifications for user: ${req.user._id}`);

    // First, let's find or create some sample subscriptions
    let subscription = await Subscription.findOne({ userId: req.user._id });
    
    if (!subscription) {
      // Create a sample subscription if none exists
      subscription = await Subscription.create({
        userId: req.user._id,
        serviceName: "Netflix",
        category: "entertainment",
        cost: 15.99,
        billingCycle: "monthly",
        nextRenewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        paymentMethod: "Credit Card",
        status: "active"
      });
      logger.info(`Created sample subscription: ${subscription._id}`);
    }

    // Create sample notifications
    const sampleNotifications = [
      {
        userId: req.user._id,
        subscriptionId: subscription._id,
        message: `Your ${subscription.serviceName} subscription will renew in 3 days. Amount: $${subscription.cost}`,
        notifyDate: new Date(),
        status: "pending"
      },
      {
        userId: req.user._id,
        subscriptionId: subscription._id,
        message: `Payment processed successfully for ${subscription.serviceName}. Amount: $${subscription.cost}`,
        notifyDate: new Date(Date.now() - 86400000), // Yesterday
        status: "sent"
      }
    ];

    // Delete existing sample notifications to avoid duplicates
    await Notification.deleteMany({ userId: req.user._id });

    // Create new sample notifications
    const createdNotifications = await Notification.insertMany(sampleNotifications);
    
    logger.info(`Created ${createdNotifications.length} sample notifications for user ${req.user._id}`);

    res.json({ 
      message: "Sample notifications created successfully",
      count: createdNotifications.length,
      notifications: createdNotifications
    });
  } catch (error) {
    logger.error("Error creating sample notifications:", error);
    next(error);
  }
});

export default router;
