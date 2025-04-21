# GradeGenius Email Support Setup

This document provides instructions on how to complete the setup for the email support system in GradeGenius.

## Environment Variables Setup

1. Open the `.env.local` file in the root of your project
2. Locate the following section:
   ```
   # Email Configuration
   EMAIL_USER=kartikey@gradegenius.io
   EMAIL_PASSWORD=your_zoho_email_password_here
   ```
3. Replace `your_zoho_email_password_here` with your actual Zoho email password

## SMTP Configuration Details

The email system uses the following Zoho SMTP settings:

- **Server/Host**: smtppro.zoho.com
- **Port**: 465
- **Mode**: SSL
- **Username**: kartikey@gradegenius.io

## Testing the Contact Form

1. Start your development server with `npm run dev`
2. Navigate to the Help & Support page or the homepage "Get in Touch" section
3. Fill out the form and submit it
4. Check both the email address you submitted the form with and kartikey@gradegenius.io to ensure emails are being delivered correctly

## Troubleshooting

- If emails are not being sent, check that your Zoho email password is correct in the `.env.local` file
- Ensure that nodemailer is installed: `npm install nodemailer @types/nodemailer`
- Check the server logs for any errors related to email sending
- Verify that your Zoho email account doesn't have additional security measures that block programmatic access (you might need to generate an app-specific password)

## Security Considerations

- Never commit your actual email password to version control
- Consider using a dedicated email address for automated messages
- Set up rate limiting for the contact form to prevent abuse 