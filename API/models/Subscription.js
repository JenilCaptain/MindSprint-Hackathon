const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: [
      'streaming', 'software', 'gaming', 'fitness', 'news', 
      'productivity', 'music', 'cloud_storage', 'security', 
      'education', 'shopping', 'finance', 'other'
    ],
    default: 'other'
  },
  cost: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      maxlength: 3
    }
  },
  billingCycle: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'semi-annual', 'annual'],
    required: true,
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  renewalDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'paused'],
    default: 'active'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other'],
    default: 'credit_card'
  },
  website: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isAutoRenewal: {
    type: Boolean,
    default: true
  },
  cancellationDate: {
    type: Date
  },
  notificationsSent: [{
    type: {
      type: String,
      enum: ['renewal_reminder', 'payment_failed', 'cancellation_reminder']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    daysBeforeRenewal: {
      type: Number
    }
  }],
  apiIntegration: {
    provider: {
      type: String,
      enum: ['stripe', 'paypal', 'manual'],
      default: 'manual'
    },
    subscriptionId: {
      type: String
    },
    lastSynced: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Calculate next billing date based on billing cycle
subscriptionSchema.methods.calculateNextBillingDate = function() {
  const current = new Date(this.nextBillingDate);
  
  switch (this.billingCycle) {
    case 'weekly':
      current.setDate(current.getDate() + 7);
      break;
    case 'monthly':
      current.setMonth(current.getMonth() + 1);
      break;
    case 'quarterly':
      current.setMonth(current.getMonth() + 3);
      break;
    case 'semi-annual':
      current.setMonth(current.getMonth() + 6);
      break;
    case 'annual':
      current.setFullYear(current.getFullYear() + 1);
      break;
  }
  
  return current;
};

// Calculate total cost per year
subscriptionSchema.virtual('annualCost').get(function() {
  const multipliers = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    'semi-annual': 2,
    annual: 1
  };
  
  return this.cost.amount * (multipliers[this.billingCycle] || 1);
});

// Check if notification should be sent
subscriptionSchema.methods.shouldSendNotification = function(daysBeforeRenewal) {
  const today = new Date();
  const renewalDate = new Date(this.renewalDate);
  const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
  
  // Check if we should send notification for this many days before renewal
  if (daysUntilRenewal !== daysBeforeRenewal) {
    return false;
  }
  
  // Check if notification was already sent for this renewal period
  const alreadySent = this.notificationsSent.some(notification => 
    notification.type === 'renewal_reminder' && 
    notification.daysBeforeRenewal === daysBeforeRenewal &&
    Math.abs(new Date(notification.sentAt) - today) < 24 * 60 * 60 * 1000 // Within 24 hours
  );
  
  return !alreadySent;
};

// Indexes for better performance
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });
subscriptionSchema.index({ renewalDate: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
