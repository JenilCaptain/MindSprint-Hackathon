const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const cron = require('node-cron');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

class EmailService {
  constructor() {
    this.emailService = process.env.EMAIL_SERVICE || 'sendgrid';
    this.setupEmailService();
  }

  setupEmailService() {
    if (this.emailService === 'sendgrid') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    } else if (this.emailService === 'ethereal') {
      // Setup Ethereal Email for testing
      this.setupEtherealEmail();
    } else {
      // Setup Nodemailer for Gmail or other SMTP
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
      this.fromEmail = process.env.GMAIL_USER;
    }
  }

  async setupEtherealEmail() {
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      this.fromEmail = testAccount.user;
      console.log('📧 Ethereal Email configured for testing');
      console.log(`Test account: ${testAccount.user}`);
    } catch (error) {
      console.error('Failed to setup Ethereal Email:', error);
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = '') {
    try {
      if (this.emailService === 'sendgrid') {
        const msg = {
          to,
          from: this.fromEmail,
          subject,
          text: textContent,
          html: htmlContent,
        };
        
        const result = await sgMail.send(msg);
        console.log(`✅ Email sent via SendGrid to ${to}`);
        return result;
      } else {
        const mailOptions = {
          from: this.fromEmail,
          to,
          subject,
          text: textContent,
          html: htmlContent
        };
        
        const result = await this.transporter.sendMail(mailOptions);
        
        if (this.emailService === 'ethereal') {
          console.log(`✅ Test email sent to ${to}`);
          console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
          console.log(`🔗 Open this URL to see the email: ${nodemailer.getTestMessageUrl(result)}`);
        } else {
          console.log(`✅ Email sent via Nodemailer to ${to}`);
        }
        return result;
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  generateRenewalReminderEmail(user, subscription, daysUntilRenewal) {
    const subject = `⏰ ${subscription.serviceName} renewal in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .subscription-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .button { 
            display: inline-block; 
            padding: 12px 25px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Subscription Renewal Reminder</h1>
          </div>
          
          <div class="content">
            <p>Hi ${user.firstName || user.username},</p>
            
            <p>This is a friendly reminder that your <strong>${subscription.serviceName}</strong> subscription will renew in <strong>${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}</strong>.</p>
            
            <div class="subscription-details">
              <h3>📋 Subscription Details</h3>
              <p><strong>Service:</strong> ${subscription.serviceName}</p>
              <p><strong>Amount:</strong> <span class="amount">${subscription.cost.currency} ${subscription.cost.amount}</span></p>
              <p><strong>Billing Cycle:</strong> ${subscription.billingCycle}</p>
              <p><strong>Next Billing Date:</strong> ${new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
              ${subscription.description ? `<p><strong>Description:</strong> ${subscription.description}</p>` : ''}
            </div>
            
            <p>If you want to cancel or modify this subscription, please log in to your dashboard:</p>
            
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Manage Subscriptions</a>
            
            <p>If you no longer want to receive these notifications, you can update your preferences in your account settings.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by Subscription Manager. If you have any questions, please contact our support team.</p>
            <p>© 2025 Subscription Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Subscription Renewal Reminder
      
      Hi ${user.firstName || user.username},
      
      Your ${subscription.serviceName} subscription will renew in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}.
      
      Details:
      - Service: ${subscription.serviceName}
      - Amount: ${subscription.cost.currency} ${subscription.cost.amount}
      - Billing Cycle: ${subscription.billingCycle}
      - Next Billing Date: ${new Date(subscription.nextBillingDate).toLocaleDateString()}
      
      Manage your subscriptions: ${process.env.CLIENT_URL}/dashboard
      
      © 2025 Subscription Manager
    `;
    
    return { subject, htmlContent, textContent };
  }

  generateWelcomeEmail(user) {
    const subject = '🎉 Welcome to Subscription Manager!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .button { 
            display: inline-block; 
            padding: 12px 25px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0;
          }
          .features { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Subscription Manager!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${user.firstName || user.username},</p>
            
            <p>Welcome to Subscription Manager! We're excited to help you take control of your recurring subscriptions.</p>
            
            <div class="features">
              <h3>🚀 What you can do:</h3>
              <ul>
                <li>📊 Track all your subscriptions in one place</li>
                <li>💰 Monitor your spending across all services</li>
                <li>⏰ Get timely renewal reminders</li>
                <li>📈 Analyze your subscription costs</li>
                <li>🔄 Manage auto-renewals</li>
              </ul>
            </div>
            
            <p>Ready to get started? Add your first subscription:</p>
            
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Get Started</a>
            
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Subscription Manager!</p>
            <p>© 2025 Subscription Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return { subject, htmlContent };
  }
}

const emailService = new EmailService();

// Notification checking service
async function checkForUpcomingRenewals() {
  try {
    console.log('🔍 Checking for upcoming subscription renewals...');
    
    // Get notification days from environment or use defaults
    const notificationDays = (process.env.DAYS_BEFORE_RENEWAL || '7,3,1')
      .split(',')
      .map(day => parseInt(day.trim()));
    
    for (const days of notificationDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Find subscriptions that renew on the target date
      const subscriptions = await Subscription.find({
        status: 'active',
        renewalDate: {
          $gte: targetDate,
          $lt: nextDay
        }
      }).populate('user');
      
      console.log(`📅 Found ${subscriptions.length} subscriptions renewing in ${days} days`);
      
      for (const subscription of subscriptions) {
        if (!subscription.user.notificationPreferences.email) {
          continue; // Skip if user doesn't want email notifications
        }
        
        if (!subscription.user.notificationPreferences.reminderDays.includes(days)) {
          continue; // Skip if user doesn't want notifications for this day count
        }
        
        if (subscription.shouldSendNotification(days)) {
          try {
            const emailData = emailService.generateRenewalReminderEmail(
              subscription.user, 
              subscription, 
              days
            );
            
            await emailService.sendEmail(
              subscription.user.email,
              emailData.subject,
              emailData.htmlContent,
              emailData.textContent
            );
            
            // Record that notification was sent
            subscription.notificationsSent.push({
              type: 'renewal_reminder',
              daysBeforeRenewal: days,
              sentAt: new Date()
            });
            
            await subscription.save();
            
            console.log(`📧 Renewal reminder sent to ${subscription.user.email} for ${subscription.serviceName}`);
          } catch (error) {
            console.error(`❌ Failed to send notification for subscription ${subscription._id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking for upcoming renewals:', error);
  }
}

// Start the notification service
function startNotificationService() {
  console.log('🚀 Starting notification service...');
  
  // Schedule to run every 30 minutes (or based on environment variable)
  const cronPattern = process.env.NOTIFICATION_CHECK_INTERVAL || '*/30 * * * *';
  
  cron.schedule(cronPattern, checkForUpcomingRenewals, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log(`⏰ Notification service scheduled with pattern: ${cronPattern}`);
  
  // Run once immediately for testing
  setTimeout(checkForUpcomingRenewals, 5000);
}

module.exports = {
  emailService,
  checkForUpcomingRenewals,
  startNotificationService
};
