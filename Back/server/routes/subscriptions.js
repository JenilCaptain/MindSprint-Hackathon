import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  validateCreateSubscription, 
  validateUpdateSubscription, 
  checkValidationResult 
} from "../middleware/validateSubscription.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import notificationBridge from "../services/notificationBridge.js";
import {
  calculateNextRenewalDate,
  calculateMonthlyPrice,
  getDaysUntilRenewal,
} from "../utils/subscriptionHelpers.js";
import logger from "../utils/logger.js";

const router = express.Router();

// @route   POST /api/subscriptions
// @desc    Create a new subscription
router.post("/", protect, validateCreateSubscription, checkValidationResult, async (req, res, next) => {
  try {
    const subscriptionData = {
      ...req.body,
      userId: req.user._id,
    };

    // Ensure nextRenewalDate is in the future
    const renewalDate = new Date(subscriptionData.nextRenewalDate);
    if (renewalDate <= new Date()) {
      return res.status(400).json({
        message: "Next renewal date must be in the future",
      });
    }

    const subscription = await Subscription.create(subscriptionData);

    // Create notification for renewal
    const notifyDate = new Date(subscriptionData.nextRenewalDate);
    notifyDate.setDate(notifyDate.getDate() - 3); // Notify 3 days before

    // Only create notification if notifyDate is in the future
    if (notifyDate > new Date()) {
      await Notification.create({
        userId: req.user._id,
        subscriptionId: subscription._id,
        message: `Your subscription to ${subscription.serviceName} will renew in 3 days`,
        notifyDate,
        status: "pending",
      });
    }

    // Also trigger advanced notification system via API bridge
    try {
      await notificationBridge.createNotification(
        {
          serviceName: subscription.serviceName,
          cost: subscription.cost,
          nextRenewalDate: subscription.nextRenewalDate,
          billingCycle: subscription.billingCycle
        },
        {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email
        }
      );
    } catch (bridgeError) {
      logger.warn("Failed to create notification via bridge:", bridgeError.message);
    }

    logger.info(
      `New subscription created: ${subscription.serviceName} for user: ${req.user._id}`
    );
    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/subscriptions
// @desc    Get all subscriptions for a user
router.get("/", protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id });
    res.json(subscriptions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/subscriptions/:id
// @desc    Get subscription by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription
router.put("/:id", protect, validateUpdateSubscription, checkValidationResult, async (req, res, next) => {
  try {
    // Check if subscription exists and belongs to user
    const existingSubscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!existingSubscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // If nextRenewalDate is being updated, validate it's in the future
    if (req.body.nextRenewalDate) {
      const renewalDate = new Date(req.body.nextRenewalDate);
      if (renewalDate <= new Date()) {
        return res.status(400).json({
          message: "Next renewal date must be in the future",
        });
      }
    }

    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    logger.info(
      `Subscription updated: ${subscription.serviceName} for user: ${req.user._id}`
    );

    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Delete subscription
router.delete("/:id", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Delete associated notifications
    await Notification.deleteMany({ subscriptionId: req.params.id });

    res.json({ message: "Subscription removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/subscriptions/test-email
// @desc    Send test email to verify email functionality
router.post("/test-email", protect, async (req, res) => {
  try {
    const { userEmail, userName } = req.body;
    
    // Use the notification bridge to send test email via advanced API
    const testEmailData = {
      type: 'test',
      recipient: userEmail || req.user.email,
      data: {
        userName: userName || req.user.name,
        serviceName: 'SubTrackr Email System',
        testMessage: 'This is a test email to verify your email configuration is working correctly.'
      }
    };

    const response = await notificationBridge.sendNotification(testEmailData);
    
    if (response.success) {
      res.json({ 
        message: "Test email sent successfully",
        details: response.message 
      });
    } else {
      res.status(500).json({ 
        message: "Failed to send test email",
        error: response.error 
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: "Error sending test email",
      error: error.message 
    });
  }
});

export default router;
