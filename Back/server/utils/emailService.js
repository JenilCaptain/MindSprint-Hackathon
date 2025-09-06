import nodemailer from "nodemailer";
import logger from "./logger.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn("Email configuration missing. Email functionality will be disabled.");
        return;
      }

      this.transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      this.isConfigured = true;
      logger.info("Email service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize email service:", error);
    }
  }

  async sendEmail(to, subject, html, text = "") {
    if (!this.isConfigured) {
      logger.warn("Email service not configured. Cannot send email.");
      return false;
    }

    try {
      const mailOptions = {
        from: `"SubTrackr" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${subject}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error("Email send error:", error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to strip HTML for text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  // Test email connection
  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      await this.transporter.verify();
      logger.info("Email connection test successful");
      return { success: true, message: "Email connection verified" };
    } catch (error) {
      logger.error("Email connection test failed:", error);
      return { success: false, error: error.message };
    }
  }
}

const emailService = new EmailService();

// Export both the service and a simple function for backward compatibility
const sendEmail = async (to, subject, html) => {
  const result = await emailService.sendEmail(to, subject, html);
  return result.success || false;
};

export default sendEmail;
export { emailService };
