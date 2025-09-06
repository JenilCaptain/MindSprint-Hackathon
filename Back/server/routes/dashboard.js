import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Subscription from "../models/Subscription.js";
import { calculateMonthlyPrice, calculateAnnualCost } from "../utils/subscriptionHelpers.js";

const router = express.Router();

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary
router.get("/summary", protect, async (req, res, next) => {
  try {
    // Get all subscriptions (including inactive for analytics)
    const allSubscriptions = await Subscription.find({
      userId: req.user._id,
    });

    const activeSubscriptions = allSubscriptions.filter(sub => sub.status === "active");

    // Calculate total monthly and yearly costs
    const totalMonthlyCost = activeSubscriptions.reduce((total, sub) => {
      return total + calculateMonthlyPrice(sub.cost, sub.billingCycle);
    }, 0);

    const totalYearlyCost = activeSubscriptions.reduce((total, sub) => {
      return total + calculateAnnualCost(sub.cost, sub.billingCycle);
    }, 0);

    // Get upcoming renewals (next 30 days)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const upcomingRenewals = await Subscription.find({
      userId: req.user._id,
      status: "active",
      nextRenewalDate: {
        $gte: new Date(),
        $lte: next30Days,
      },
    }).sort({ nextRenewalDate: 1 });

    // Get subscriptions by category
    const subscriptionsByCategory = await Subscription.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: "active",
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalCost: { $sum: "$cost" },
          services: { $push: "$serviceName" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get subscriptions by billing cycle
    const subscriptionsByBillingCycle = await Subscription.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: "active",
        },
      },
      {
        $group: {
          _id: "$billingCycle",
          count: { $sum: 1 },
          averageCost: { $avg: "$cost" },
        },
      },
    ]);

    // Get recent activity (last 30 days)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentlyAdded = await Subscription.find({
      userId: req.user._id,
      createdAt: { $gte: last30Days },
    }).sort({ createdAt: -1 }).limit(5);

    // Calculate savings if cancelled inactive subscriptions
    const inactiveSubscriptions = allSubscriptions.filter(sub => sub.status !== "active");
    const potentialMonthlySavings = inactiveSubscriptions.reduce((total, sub) => {
      return total + calculateMonthlyPrice(sub.cost, sub.billingCycle);
    }, 0);

    res.json({
      totalSubscriptions: activeSubscriptions.length,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      totalYearlyCost: Math.round(totalYearlyCost * 100) / 100,
      upcomingRenewals,
      subscriptionsByCategory,
      subscriptionsByBillingCycle,
      recentlyAdded,
      potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
      statistics: {
        activeCount: activeSubscriptions.length,
        inactiveCount: inactiveSubscriptions.length,
        totalCount: allSubscriptions.length,
        averageMonthlyCost: activeSubscriptions.length > 0 
          ? Math.round((totalMonthlyCost / activeSubscriptions.length) * 100) / 100 
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/dashboard/upcoming-renewals
// @desc    Get upcoming renewals
router.get("/upcoming-renewals", protect, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const upcomingRenewals = await Subscription.find({
      userId: req.user._id,
      status: "active",
      nextRenewalDate: {
        $gte: new Date(),
        $lte: targetDate,
      },
    }).sort({ nextRenewalDate: 1 });

    // Group by days until renewal
    const groupedRenewals = upcomingRenewals.reduce((acc, subscription) => {
      const today = new Date();
      const renewalDate = new Date(subscription.nextRenewalDate);
      const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
      
      if (!acc[daysUntilRenewal]) {
        acc[daysUntilRenewal] = [];
      }
      acc[daysUntilRenewal].push(subscription);
      
      return acc;
    }, {});

    res.json({
      renewals: upcomingRenewals,
      groupedRenewals,
      totalCount: upcomingRenewals.length,
      daysAhead: days,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
