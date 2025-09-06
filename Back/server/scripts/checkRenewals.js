import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import notificationBridge from "../services/notificationBridge.js";
import logger from "../utils/logger.js";

dotenv.config();

const checkAndNotifySubscriptions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB Connected for renewal check");

    // Get current date
    const today = new Date();
    const targetDates = [1, 3, 7]; // Check for 1, 3, and 7 days before renewal

    let totalNotificationsSent = 0;

    for (const daysAhead of targetDates) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysAhead);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find subscriptions that renew on the target date
      const subscriptions = await Subscription.find({
        status: "active",
        nextRenewalDate: {
          $gte: targetDate,
          $lt: nextDay,
        },
      }).populate("userId");

      for (const subscription of subscriptions) {
        try {
          if (!subscription.userId || !subscription.userId.email) {
            logger.warn(`Invalid user data for subscription ${subscription._id}`);
            continue;
          }

          // Check if we should send notification for this subscription
          if (!subscription.shouldSendNotification(daysAhead)) {
            continue;
          }

          const user = subscription.userId;

          // Send notification via API bridge (if available)
          try {
            await notificationBridge.createNotification(
              {
                serviceName: subscription.serviceName,
                cost: subscription.cost,
                nextRenewalDate: subscription.nextRenewalDate,
                billingCycle: subscription.billingCycle,
              },
              {
                _id: user._id,
                name: user.name,
                email: user.email,
              }
            );
          } catch (bridgeError) {
            logger.warn(`Bridge notification failed for ${subscription.serviceName}:`, bridgeError.message);
          }

          // Create local notification record
          const notification = await Notification.create({
            userId: user._id,
            subscriptionId: subscription._id,
            message: `Your subscription to ${subscription.serviceName} will renew in ${daysAhead} day${daysAhead > 1 ? 's' : ''}`,
            notifyDate: new Date(),
            status: "sent",
          });

          // Add to subscription's notification history
          subscription.notificationsSent.push({
            type: "renewal_reminder",
            sentAt: new Date(),
            daysBeforeRenewal: daysAhead,
          });
          await subscription.save();

          totalNotificationsSent++;
          logger.info(
            `Renewal notification sent to ${user.email} for ${subscription.serviceName} (${daysAhead} days ahead)`
          );

        } catch (error) {
          logger.error(`Error processing subscription ${subscription._id}:`, error);
        }
      }
    }

    // Also handle any pending notifications from the notification queue
    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);
    const today_end = new Date();
    today_end.setHours(23, 59, 59, 999);

    const pendingNotifications = await Notification.find({
      status: "pending",
      notifyDate: {
        $gte: today_start,
        $lte: today_end,
      },
    }).populate("userId subscriptionId");

    for (const notification of pendingNotifications) {
      try {
        if (!notification.userId || !notification.subscriptionId) {
          notification.status = "failed";
          await notification.save();
          continue;
        }

        const user = notification.userId;
        const subscription = notification.subscriptionId;

        // Try sending via bridge first
        try {
          await notificationBridge.createNotification(
            {
              serviceName: subscription.serviceName,
              cost: subscription.cost,
              nextRenewalDate: subscription.nextRenewalDate,
              billingCycle: subscription.billingCycle,
            },
            {
              _id: user._id,
              name: user.name,
              email: user.email,
            }
          );
        } catch (bridgeError) {
          // Fallback to local email if bridge fails
          if (sendEmail) {
            const emailContent = `
              <h2>Subscription Renewal Reminder</h2>
              <p>Hello ${user.name},</p>
              <p>${notification.message}</p>
              <p>Details:</p>
              <ul>
                <li>Service: ${subscription.serviceName}</li>
                <li>Amount: $${subscription.cost}</li>
                <li>Renewal Date: ${new Date(subscription.nextRenewalDate).toLocaleDateString()}</li>
                <li>Payment Method: ${subscription.paymentMethod}</li>
              </ul>
              <p>Please ensure you have sufficient funds available.</p>
            `;

            await sendEmail(
              user.email,
              "Subscription Renewal Reminder",
              emailContent
            );
          }
        }

        notification.status = "sent";
        await notification.save();
        totalNotificationsSent++;

        logger.info(`Pending notification processed for ${user.email} - ${subscription.serviceName}`);
      } catch (error) {
        logger.error("Error processing pending notification:", error);
        notification.status = "failed";
        await notification.save();
      }
    }

    mongoose.disconnect();
    logger.info(`Renewal check completed. Total notifications sent: ${totalNotificationsSent}`);
    
    return {
      success: true,
      notificationsSent: totalNotificationsSent,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Script error:", error);
    mongoose.disconnect();
    throw error;
  }
};

// If running directly, execute the function
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndNotifySubscriptions()
    .then((result) => {
      console.log("✅ Renewal check completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Renewal check failed:", error);
      process.exit(1);
    });
}

export default checkAndNotifySubscriptions;
