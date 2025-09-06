# 📧 Email Configuration Guide for SubTrackr

## Current Status
The email system is integrated and ready to use, but requires email service credentials to send actual emails.

## Option 1: SendGrid (Recommended - Free tier available)

### Steps:
1. **Sign up for SendGrid**:
   - Go to https://sendgrid.com/
   - Create a free account (up to 100 emails/day)

2. **Get API Key**:
   - Login to SendGrid dashboard
   - Go to Settings > API Keys
   - Create a new API key with "Full Access"
   - Copy the API key

3. **Update Configuration**:
   ```bash
   # In API/.env file
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   SENDGRID_FROM_EMAIL=your-email@domain.com
   ```

### Benefits:
- ✅ 100 free emails per day
- ✅ Professional delivery
- ✅ Easy setup
- ✅ Good deliverability

---

## Option 2: Gmail SMTP

### Steps:
1. **Enable 2FA on Gmail**:
   - Go to Google Account settings
   - Security > 2-Step Verification > Turn on

2. **Generate App Password**:
   - Google Account > Security
   - App passwords > Generate new
   - Select "Mail" and "Other (custom)" > Enter "SubTrackr"
   - Copy the 16-character password

3. **Update Configuration**:
   ```bash
   # In API/.env file
   EMAIL_SERVICE=gmail
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_PASS=your_16_character_app_password
   ```

### Benefits:
- ✅ Free to use
- ✅ Uses your existing Gmail
- ✅ Reliable delivery

---

## Option 3: Temporary Testing (Ethereal Email)

For development/testing without real email delivery:

1. **Update the email service configuration**:
   ```bash
   # In API/.env file
   EMAIL_SERVICE=ethereal
   ```

2. **This will**:
   - ✅ Generate test credentials automatically
   - ✅ Show email preview URLs in console
   - ✅ Perfect for development testing

---

## Quick Test Setup

### For immediate testing, I'll set up Ethereal Email (test mode):

1. Update the `.env` file
2. Restart the API service
3. Test emails will generate preview links in the console

## How to Apply Configuration

1. **Choose your preferred option above**
2. **Update the API/.env file** with the appropriate credentials
3. **Restart the API service**: 
   ```bash
   cd API
   node server.js
   ```
4. **Test using the "Test Email" button** in the dashboard

## Troubleshooting

- **SendGrid**: Make sure API key starts with "SG."
- **Gmail**: Ensure you're using App Password, not regular password
- **Firewall**: Check if ports 587/465 are open for SMTP
- **Console Logs**: Check API service terminal for error messages

## Security Note
Never commit real email credentials to version control. Keep them in `.env` files only.
