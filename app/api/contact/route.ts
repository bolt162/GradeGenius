import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - make it optional for public contact form
    const { userId } = await auth();
    
    // Parse request body
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: 'smtppro.zoho.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER || 'kartikey@gradegenius.io',
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gradegenius.com',
      to: 'kartikey@gradegenius.io',
      replyTo: email,
      subject: `GradeGenius: ${subject}${userId ? ' (Authenticated User)' : ' (Website Contact)'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">New Contact Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
            This email was sent from the GradeGenius ${userId ? 'Support Form' : 'Website Contact Form'}.
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const confirmationMailOptions = {
      from: process.env.EMAIL_USER || 'support@gradegenius.com',
      to: email,
      subject: `GradeGenius - We received your ${userId ? 'support request' : 'message'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Thank You for Contacting GradeGenius</h2>
          <p>Hello ${name},</p>
          <p>We've received your ${userId ? 'support request' : 'message'} regarding "${subject}". Our team will review your message and get back to you as soon as possible.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p><strong>Your message:</strong></p>
            <p>${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <p>If you have any additional information to add, please reply to this email.</p>
          <p>Thank you for your interest in GradeGenius!</p>
        </div>
      `,
    };

    await transporter.sendMail(confirmationMailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 