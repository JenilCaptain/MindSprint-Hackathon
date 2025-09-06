import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Entertainment", "Productivity", "Utilities", "Gaming", "Music", "Design", "Storage", "News", "Health", "Other"],
    },
    cost: {
      type: Number,
      required: [true, "Cost is required"],
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      maxlength: 3,
    },
    billingCycle: {
      type: String,
      required: [true, "Billing cycle is required"],
      enum: ["Weekly", "Monthly", "Quarterly", "Yearly"],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextRenewalDate: {
      type: Date,
      required: [true, "Next renewal date is required"],
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "paused"],
      default: "active",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    website: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
    isAutoRenewal: {
      type: Boolean,
      default: true,
    },
    cancellationDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
    notificationsSent: [{
      type: {
        type: String,
        enum: ["renewal_reminder", "payment_failed", "cancellation_reminder"],
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
      daysBeforeRenewal: {
        type: Number,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Calculate next billing date based on billing cycle
subscriptionSchema.methods.calculateNextRenewalDate = function() {
  const current = new Date(this.nextRenewalDate);
  
  switch (this.billingCycle) {
    case "Weekly":
      current.setDate(current.getDate() + 7);
      break;
    case "Monthly":
      current.setMonth(current.getMonth() + 1);
      break;
    case "Quarterly":
      current.setMonth(current.getMonth() + 3);
      break;
    case "Yearly":
      current.setFullYear(current.getFullYear() + 1);
      break;
  }
  
  return current;
};

// Calculate total cost per year
subscriptionSchema.virtual("annualCost").get(function() {
  const multipliers = {
    Weekly: 52,
    Monthly: 12,
    Quarterly: 4,
    Yearly: 1,
  };
  
  return this.cost * (multipliers[this.billingCycle] || 1);
});

// Check if notification should be sent
subscriptionSchema.methods.shouldSendNotification = function(daysBeforeRenewal) {
  const today = new Date();
  const renewalDate = new Date(this.nextRenewalDate);
  const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
  
  // Check if we should send notification for this many days before renewal
  if (daysUntilRenewal !== daysBeforeRenewal) {
    return false;
  }
  
  // Check if notification was already sent for this renewal period
  const alreadySent = this.notificationsSent.some(notification => 
    notification.type === "renewal_reminder" && 
    notification.daysBeforeRenewal === daysBeforeRenewal &&
    Math.abs(new Date(notification.sentAt) - today) < 24 * 60 * 60 * 1000 // Within 24 hours
  );
  
  return !alreadySent;
};

// Index for faster queries
subscriptionSchema.index({ userId: 1, nextRenewalDate: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
