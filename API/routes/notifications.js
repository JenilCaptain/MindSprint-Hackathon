const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { emailService, checkForUpcomingRenewals } = require('../services/notificationService');
const Subscription = require('../models/Subscription');

const router = express.Router();

// @route   POST /api/notifications/create
// @desc    Create notification from bridge (internal API call)
// @access  Public (internal use only)
router.post('/create', async (req, res) => {
  try {
    const { subscription, user, type } = req.body;
    
    console.log(`📧 Creating notification for ${user.name} - ${subscription.serviceName}`);
    
    // Calculate days until renewal
    const renewalDate = new Date(subscription.nextRenewalDate);
    const today = new Date();
    const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
    
    // Send email if renewal is within 7 days
    if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
      const { emailService } = require('../services/notificationService');
      const emailData = emailService.generateRenewalReminderEmail(user, subscription, daysUntilRenewal);
      
      await emailService.sendEmail(
        user.email,
        emailData.subject,
        emailData.htmlContent,
        emailData.textContent
      );
      
      console.log(`✅ Renewal reminder sent to ${user.email} for ${subscription.serviceName}`);
    }
    
    res.json({ 
      message: 'Notification processed successfully',
      daysUntilRenewal,
      emailSent: daysUntilRenewal <= 7
    });
  } catch (error) {
    console.error('Bridge notification creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create notification',
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/test-email
// @desc    Send test email (for development/testing)
// @access  Private
router.post('/test-email', auth, [
  body('type')
    .isIn(['welcome', 'renewal_reminder'])
    .withMessage('Invalid email type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type } = req.body;
    const user = req.user;

    if (type === 'welcome') {
      const emailData = emailService.generateWelcomeEmail(user);
      await emailService.sendEmail(
        user.email,
        emailData.subject,
        emailData.htmlContent
      );
    } else if (type === 'renewal_reminder') {
      // Find a test subscription or create mock data
      const subscription = await Subscription.findOne({ 
        user: user._id, 
        status: 'active' 
      });

      if (!subscription) {
        return res.status(400).json({ 
          message: 'No active subscriptions found for testing. Please add a subscription first.' 
        });
      }

      const emailData = emailService.generateRenewalReminderEmail(user, subscription, 3);
      await emailService.sendEmail(
        user.email,
        emailData.subject,
        emailData.htmlContent,
        emailData.textContent
      );
    }

    res.json({ 
      message: `Test ${type} email sent successfully to ${user.email}` 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/test-email-simple
// @desc    Send simple test email (for bridge testing)
// @access  Public (internal use only)
router.post('/test-email-simple', async (req, res) => {
  try {
    const { email, type = 'test', userName = 'Test User' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    // Create mock data for testing
    const mockUser = { name: userName, email: email };
    const mockSubscription = {
      serviceName: 'SubTrackr Email Test',
      cost: 9.99,
      billingCycle: 'monthly',
      nextRenewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    let emailData;
    if (type === 'welcome') {
      emailData = emailService.generateWelcomeEmail(mockUser);
    } else {
      emailData = emailService.generateRenewalReminderEmail(mockUser, mockSubscription, 7);
    }
    
    await emailService.sendEmail(
      email,
      emailData.subject,
      emailData.htmlContent,
      emailData.textContent
    );

    res.json({ 
      message: `Test email sent successfully to ${email}`,
      type: type
    });
  } catch (error) {
    console.error('Simple test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/manual-check
// @desc    Manually trigger notification check (for testing)
// @access  Private (Admin only in production)
router.post('/manual-check', auth, async (req, res) => {
  try {
    // In production, you might want to add admin role check here
    console.log(`Manual notification check triggered by user ${req.user.email}`);
    
    await checkForUpcomingRenewals();
    
    res.json({ 
      message: 'Notification check completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual notification check error:', error);
    res.status(500).json({ 
      message: 'Failed to run notification check',
      error: error.message 
    });
  }
});

// @route   GET /api/notifications/upcoming-renewals
// @desc    Get upcoming renewals for notifications
// @access  Private
router.get('/upcoming-renewals', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const daysAhead = parseInt(req.query.days) || 30; // Default to 30 days

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const upcomingSubscriptions = await Subscription.find({
      user: userId,
      status: 'active',
      renewalDate: {
        $gte: new Date(),
        $lte: targetDate
      }
    }).sort({ renewalDate: 1 });

    // Group by days until renewal
    const groupedRenewals = upcomingSubscriptions.reduce((acc, subscription) => {
      const today = new Date();
      const renewalDate = new Date(subscription.renewalDate);
      const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
      
      if (!acc[daysUntilRenewal]) {
        acc[daysUntilRenewal] = [];
      }
      acc[daysUntilRenewal].push(subscription);
      
      return acc;
    }, {});

    res.json({
      upcomingRenewals: groupedRenewals,
      total: upcomingSubscriptions.length,
      daysAhead
    });
  } catch (error) {
    console.error('Get upcoming renewals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/history
// @desc    Get notification history for user's subscriptions
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find({ user: userId })
      .select('serviceName notificationsSent')
      .sort({ 'notificationsSent.sentAt': -1 });

    // Flatten notifications from all subscriptions
    const allNotifications = [];
    subscriptions.forEach(subscription => {
      subscription.notificationsSent.forEach(notification => {
        allNotifications.push({
          ...notification.toObject(),
          subscription: {
            id: subscription._id,
            serviceName: subscription.serviceName
          }
        });
      });
    });

    // Sort by date and paginate
    allNotifications.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    const paginatedNotifications = allNotifications.slice(skip, skip + limit);

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allNotifications.length / limit),
        totalNotifications: allNotifications.length,
        hasNextPage: skip + limit < allNotifications.length,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', auth, [
  body('email')
    .isBoolean()
    .withMessage('Email preference must be boolean'),
  body('sms')
    .optional()
    .isBoolean()
    .withMessage('SMS preference must be boolean'),
  body('push')
    .optional()
    .isBoolean()
    .withMessage('Push preference must be boolean'),
  body('reminderDays')
    .isArray()
    .withMessage('Reminder days must be an array')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('Reminder days array cannot be empty');
      }
      if (value.some(day => !Number.isInteger(day) || day < 1 || day > 365)) {
        throw new Error('Reminder days must be integers between 1 and 365');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const userId = req.user._id;
    const { email, sms, push, reminderDays } = req.body;

    const updateData = {
      'notificationPreferences.email': email,
      'notificationPreferences.reminderDays': reminderDays
    };

    if (sms !== undefined) {
      updateData['notificationPreferences.sms'] = sms;
    }
    if (push !== undefined) {
      updateData['notificationPreferences.push'] = push;
    }

    const updatedUser = await req.user.constructor.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Notification preferences updated successfully',
      notificationPreferences: updatedUser.notificationPreferences
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Server error during preferences update' });
  }
});

// @route   POST /api/notifications/subscription/:id/remind-now
// @desc    Send immediate renewal reminder for specific subscription
// @access  Private
router.post('/subscription/:id/remind-now', auth, async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId
    }).populate('user');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ 
        message: 'Cannot send reminder for inactive subscription' 
      });
    }

    // Calculate days until renewal
    const today = new Date();
    const renewalDate = new Date(subscription.renewalDate);
    const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));

    // Generate and send email
    const emailData = emailService.generateRenewalReminderEmail(
      subscription.user,
      subscription,
      Math.max(0, daysUntilRenewal)
    );

    await emailService.sendEmail(
      subscription.user.email,
      emailData.subject,
      emailData.htmlContent,
      emailData.textContent
    );

    // Record notification
    subscription.notificationsSent.push({
      type: 'renewal_reminder',
      daysBeforeRenewal: daysUntilRenewal,
      sentAt: new Date()
    });

    await subscription.save();

    res.json({
      message: 'Renewal reminder sent successfully',
      sentTo: subscription.user.email,
      daysUntilRenewal
    });
  } catch (error) {
    console.error('Send immediate reminder error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ 
      message: 'Failed to send reminder',
      error: error.message 
    });
  }
});

// @route   GET /api/notifications/status
// @desc    Get notification service status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's notification preferences
    const user = await req.user.constructor.findById(userId).select('notificationPreferences');
    
    // Get count of upcoming renewals
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingCount = await Subscription.countDocuments({
      user: userId,
      status: 'active',
      renewalDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });

    // Get recent notifications count
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const subscriptionsWithRecentNotifications = await Subscription.find({
      user: userId,
      'notificationsSent.sentAt': { $gte: sevenDaysAgo }
    });

    const recentNotificationsCount = subscriptionsWithRecentNotifications.reduce((count, sub) => {
      return count + sub.notificationsSent.filter(notif => 
        new Date(notif.sentAt) >= sevenDaysAgo
      ).length;
    }, 0);

    res.json({
      notificationService: {
        status: 'active',
        lastChecked: new Date().toISOString(),
        checkInterval: process.env.NOTIFICATION_CHECK_INTERVAL || '*/30 * * * *'
      },
      userPreferences: user.notificationPreferences,
      statistics: {
        upcomingRenewals: upcomingCount,
        recentNotifications: recentNotificationsCount
      }
    });
  } catch (error) {
    console.error('Get notification status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
