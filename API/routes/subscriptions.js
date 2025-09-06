const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const subscriptionValidation = [
  body('serviceName')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Service name is required and must be less than 100 characters'),
  body('cost.amount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Cost amount must be a positive number'),
  body('cost.currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('billingCycle')
    .isIn(['weekly', 'monthly', 'quarterly', 'semi-annual', 'annual'])
    .withMessage('Invalid billing cycle'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('category')
    .optional()
    .isIn([
      'streaming', 'software', 'gaming', 'fitness', 'news', 
      'productivity', 'music', 'cloud_storage', 'security', 
      'education', 'shopping', 'finance', 'other'
    ])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// @route   GET /api/subscriptions
// @desc    Get all user subscriptions
// @access  Private
router.get('/', auth, [
  query('status')
    .optional()
    .isIn(['active', 'cancelled', 'expired', 'paused'])
    .withMessage('Invalid status filter'),
  query('category')
    .optional()
    .isIn([
      'streaming', 'software', 'gaming', 'fitness', 'news', 
      'productivity', 'music', 'cloud_storage', 'security', 
      'education', 'shopping', 'finance', 'other'
    ])
    .withMessage('Invalid category filter'),
  query('sortBy')
    .optional()
    .isIn(['serviceName', 'cost', 'nextBillingDate', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, category, sortBy = 'nextBillingDate', sortOrder = 'asc' } = req.query;
    const userId = req.user._id;

    // Build filter
    const filter = { user: userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const subscriptions = await Subscription.find(filter)
      .sort(sort)
      .lean();

    // Calculate totals
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
      const monthlyAmount = sub.billingCycle === 'weekly' ? sub.cost.amount * 4.33 :
                           sub.billingCycle === 'monthly' ? sub.cost.amount :
                           sub.billingCycle === 'quarterly' ? sub.cost.amount / 3 :
                           sub.billingCycle === 'semi-annual' ? sub.cost.amount / 6 :
                           sub.billingCycle === 'annual' ? sub.cost.amount / 12 : 0;
      return sum + monthlyAmount;
    }, 0);

    const totalAnnual = activeSubscriptions.reduce((sum, sub) => {
      const annualAmount = sub.billingCycle === 'weekly' ? sub.cost.amount * 52 :
                          sub.billingCycle === 'monthly' ? sub.cost.amount * 12 :
                          sub.billingCycle === 'quarterly' ? sub.cost.amount * 4 :
                          sub.billingCycle === 'semi-annual' ? sub.cost.amount * 2 :
                          sub.billingCycle === 'annual' ? sub.cost.amount : 0;
      return sum + annualAmount;
    }, 0);

    res.json({
      subscriptions,
      summary: {
        total: subscriptions.length,
        active: activeSubscriptions.length,
        cancelled: subscriptions.filter(sub => sub.status === 'cancelled').length,
        expired: subscriptions.filter(sub => sub.status === 'expired').length,
        paused: subscriptions.filter(sub => sub.status === 'paused').length,
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalAnnual: Math.round(totalAnnual * 100) / 100
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subscriptions/:id
// @desc    Get subscription by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subscriptions
// @desc    Create new subscription
// @access  Private
router.post('/', auth, subscriptionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const subscriptionData = {
      ...req.body,
      user: req.user._id
    };

    // Calculate next billing date and renewal date
    const startDate = new Date(subscriptionData.startDate);
    const nextBillingDate = new Date(startDate);
    
    switch (subscriptionData.billingCycle) {
      case 'weekly':
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        break;
      case 'monthly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        break;
      case 'semi-annual':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 6);
        break;
      case 'annual':
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
    }

    subscriptionData.nextBillingDate = nextBillingDate;
    subscriptionData.renewalDate = nextBillingDate;

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error during subscription creation' });
  }
});

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription
// @access  Private
router.put('/:id', auth, subscriptionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'user') { // Don't allow changing user
        subscription[key] = req.body[key];
      }
    });

    // Recalculate next billing date if billing cycle or start date changed
    if (req.body.billingCycle || req.body.startDate) {
      const baseDate = req.body.startDate ? new Date(req.body.startDate) : subscription.startDate;
      const nextBillingDate = new Date(baseDate);
      
      switch (subscription.billingCycle) {
        case 'weekly':
          nextBillingDate.setDate(nextBillingDate.getDate() + 7);
          break;
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'semi-annual':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 6);
          break;
        case 'annual':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }

      subscription.nextBillingDate = nextBillingDate;
      subscription.renewalDate = nextBillingDate;
    }

    await subscription.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error during subscription update' });
  }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Delete subscription
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error during subscription deletion' });
  }
});

// @route   PATCH /api/subscriptions/:id/status
// @desc    Update subscription status
// @access  Private
router.patch('/:id/status', auth, [
  body('status')
    .isIn(['active', 'cancelled', 'expired', 'paused'])
    .withMessage('Invalid status'),
  body('cancellationDate')
    .optional()
    .isISO8601()
    .withMessage('Cancellation date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, cancellationDate } = req.body;

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = status;
    
    if (status === 'cancelled' && cancellationDate) {
      subscription.cancellationDate = new Date(cancellationDate);
    }

    await subscription.save();

    res.json({
      message: `Subscription ${status} successfully`,
      subscription
    });
  } catch (error) {
    console.error('Update subscription status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error during status update' });
  }
});

// @route   GET /api/subscriptions/analytics/overview
// @desc    Get subscription analytics overview
// @access  Private
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const subscriptions = await Subscription.find({ user: userId });

    // Category breakdown
    const categoryBreakdown = subscriptions.reduce((acc, sub) => {
      if (sub.status === 'active') {
        acc[sub.category] = (acc[sub.category] || 0) + sub.cost.amount;
      }
      return acc;
    }, {});

    // Monthly spending by billing cycle
    const spendingBreakdown = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((acc, sub) => {
        acc[sub.billingCycle] = (acc[sub.billingCycle] || 0) + sub.cost.amount;
        return acc;
      }, {});

    // Upcoming renewals (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingRenewals = subscriptions.filter(sub => 
      sub.status === 'active' && 
      new Date(sub.renewalDate) <= thirtyDaysFromNow
    ).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    res.json({
      categoryBreakdown,
      spendingBreakdown,
      upcomingRenewals: upcomingRenewals.slice(0, 10), // Limit to 10 upcoming
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
