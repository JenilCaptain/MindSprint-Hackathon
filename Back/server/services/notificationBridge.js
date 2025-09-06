import axios from 'axios';

class NotificationBridge {
  constructor() {
    this.apiBaseUrl = process.env.NOTIFICATION_API_URL || 'http://localhost:5001/api';
  }

  // Forward notification creation to the API service
  async createNotification(subscriptionData, userData) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/notifications/create`, {
        subscription: subscriptionData,
        user: userData,
        type: 'renewal_reminder'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Notification created via API service');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create notification via API service:', error.message);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  // Send test email
  async sendTestEmail(userEmail, type = 'welcome') {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/notifications/test-email-simple`, {
        email: userEmail,
        type: type,
        userName: 'Test User' // Mock data for testing
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ Test email sent via API service');
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send test email via API service:', error.message);
      
      // Try fallback direct email service
      try {
        console.log('🔄 Attempting fallback email service...');
        const { sendEmail } = await import('../utils/emailService.js');
        
        await sendEmail(
          userEmail,
          'SubTrackr Test Email',
          `<h2>Hello Test User!</h2>
           <p>This is a test email to verify your email configuration is working correctly.</p>
           <p>If you received this email, your SubTrackr email system is functioning properly!</p>
           <br>
           <p><strong>SubTrackr Team</strong></p>`,
          `Hello Test User! This is a test email to verify your email configuration is working correctly. If you received this email, your SubTrackr email system is functioning properly! - SubTrackr Team`
        );
        
        console.log('✅ Fallback test email sent successfully');
        return { success: true, message: 'Test email sent successfully (via fallback service)' };
      } catch (fallbackError) {
        console.error('❌ Fallback email service also failed:', fallbackError.message);
        return { success: false, error: `Both API service and fallback failed. API: ${error.message}, Fallback: ${fallbackError.message}` };
      }
    }
  }

  // General notification sender
  async sendNotification(notificationData) {
    try {
      if (notificationData.type === 'test') {
        return await this.sendTestEmail(notificationData.recipient, 'test');
      }

      const response = await axios.post(`${this.apiBaseUrl}/notifications/send`, notificationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Notification sent via API service');
      return { success: true, message: 'Notification sent successfully', data: response.data };
    } catch (error) {
      console.error('❌ Failed to send notification via API service:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get notification status from API service
  async getNotificationStatus(userId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/notifications/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get notification status:', error.message);
      return { enabled: false, count: 0 };
    }
  }
}

export default new NotificationBridge();
