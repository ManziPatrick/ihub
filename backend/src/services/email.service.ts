import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Config } from '../models/Config';

dotenv.config();

interface EmailConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
  siteName: string;
}

const getEmailConfig = async (): Promise<EmailConfig> => {
  try {
    const serverConfig = await Config.findOne({ key: 'emailServer' });
    const portConfig = await Config.findOne({ key: 'emailPort' });
    const senderConfig = await Config.findOne({ key: 'emailSender' });
    const passConfig = await Config.findOne({ key: 'emailAppPassword' });
    const siteNameConfig = await Config.findOne({ key: 'siteName' });

    let host = serverConfig ? String(serverConfig.value) : process.env.SMTP_HOST || 'smtp.zoho.com';
    let portStr = portConfig ? String(portConfig.value) : process.env.SMTP_PORT || '465';
    let user = senderConfig ? String(senderConfig.value) : process.env.SMTP_USER;
    let pass = passConfig ? String(passConfig.value) : process.env.SMTP_PASS;
    let siteName = siteNameConfig ? String(siteNameConfig.value) : "Bootskills Academy";
    
    // Clear quotes if present from JSON strings
    host = host.replace(/^"|"$/g, '');
    portStr = portStr.replace(/^"|"$/g, '');
    user = user?.replace(/^"|"$/g, '');
    pass = pass?.replace(/^"|"$/g, '');
    siteName = siteName.replace(/^"|"$/g, '');

    let from = user ? `${siteName} <${user}>` : process.env.EMAIL_FROM || `${siteName} <noreply@bootskills.com>`;

    return { host, port: parseInt(portStr), user, pass, from, siteName };
  } catch (error) {
    return {
      host: process.env.SMTP_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM || 'Bootskills Academy <noreply@bootskills.com>',
      siteName: "Bootskills Academy"
    };
  }
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const config = await getEmailConfig();

    // Skip sending if SMTP not configured
    if (!config.user || !config.pass) {
      console.log('[Email] SMTP not configured, skipping email:', options.subject);
      return true; // Return true to not block flow
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // Use true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    });

    console.log(`[Email] Sent successfully to ${options.to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send:', error.message);
    return false;
  }
};

// ========== EMAIL TEMPLATES ==========

export const sendWelcomeEmail = async (
  email: string,
  username: string,
  role: string,
  resetToken?: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const setPasswordUrl = resetToken
    ? `${process.env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #D4AF37 0%, #B08D2A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
        .btn-setpw { display: inline-block; background: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); }
        .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Bootskills Academy!</h1>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>We're thrilled to have you join our community of innovators and builders!</p>
          <p>Your account has been successfully created as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.</p>
          <p>At Bootskills Academy, we focus on real-world engineering skills that matter.</p>
          ${setPasswordUrl ? `
            <div class="warning-box">
              <strong>🔑 Set Your Password</strong>
              <p style="margin: 8px 0 0;">Your account was created by an administrator. Please click the button below to set your own password and activate your account. This link expires in 1 hour.</p>
            </div>
            <div style="text-align: center;">
              <a href="${setPasswordUrl}" class="btn-setpw">🔐 Set My Password</a>
            </div>
            <p style="margin-top: 16px; font-size: 13px; color: #666; text-align: center;">
              Or copy this link: <a href="${setPasswordUrl}" style="color: #2563eb; word-break: break-all;">${setPasswordUrl}</a>
            </p>
          ` : `
            <p>You can now access your dashboard to start your learning journey.</p>
            <a href="${process.env.CLIENT_ORIGIN}/login" class="btn">Access My Dashboard</a>
          `}
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to Bootskills Academy, ${username}!`,
    html
  });
};

/**
 * Send admin notification for new user creation
 */
export const sendAdminNewUserNotification = async (
  adminEmail: string,
  newUserName: string,
  newUserEmail: string,
  newUserRole: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #333;">New User Account Created</h2>
        <p>A new user account has been successfully created in the system:</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Name:</strong> ${newUserName}</li>
          <li><strong>Email:</strong> ${newUserEmail}</li>
          <li><strong>Role:</strong> ${newUserRole}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>You can manage this user from the Admin Portal.</p>
        <a href="${process.env.CLIENT_ORIGIN}/portal/admin/users" style="display: inline-block; padding: 10px 20px; background: #333; color: #fff; text-decoration: none; border-radius: 4px;">View User List</a>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Admin Notification: New User Registered (${newUserName})`,
    html
  });
};

/**
 * Send meeting invitation to student and mentor
 */
export const sendMeetingInvitation = async (
  recipientEmail: string,
  recipientName: string,
  participantName: string, // The other person
  bookingDetails: {
    type: string;
    date: string;
    time: string;
    meetingLink?: string;
  }
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Meeting Scheduled</h1>
        </div>
        <div class="content">
          <h2>Hi ${recipientName},</h2>
          <p>Your ${bookingDetails.type} meeting with <strong>${participantName}</strong> has been scheduled.</p>
          
          <div class="details-box">
            <p><strong>Topic:</strong> ${bookingDetails.type}</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            ${bookingDetails.meetingLink ? `<p><strong>Link:</strong> <a href="${bookingDetails.meetingLink}">${bookingDetails.meetingLink}</a></p>` : ''}
          </div>
          
          ${bookingDetails.meetingLink ? `
            <p>Please click the button below to join the meeting at the scheduled time:</p>
            <a href="${bookingDetails.meetingLink}" class="btn">Join Meeting</a>
          ` : '<p>The meeting link will be updated in your portal shortly.</p>'}
          
          <p>If you need to reschedule, please do so through your portal dashboard.</p>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Meeting Invitation: ${bookingDetails.type} with ${participantName}`,
    html
  });
};

/**
 * Send application confirmation email
 */
export const sendApplicationConfirmation = async (
  email: string,
  studentName: string,
  programTitle: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Application Received!</h1>
        </div>
        <div class="content">
          <h2>Hi ${studentName},</h2>
          <p>Thank you for applying to the <strong>${programTitle}</strong> internship program at Bootskills Academy!</p>
          <p>Your application has been received and is now under review. Here's what happens next:</p>
          <ol>
            <li>Our team will review your application within 3-5 business days</li>
            <li>You'll receive an email with the decision (approved/pending/waitlisted)</li>
            <li>If approved, you'll get instructions for the next steps</li>
          </ol>
          <p>In the meantime, make sure your profile is complete and up-to-date.</p>
          <a href="${process.env.CLIENT_ORIGIN}/portal/student/internships" class="btn">View Application Status</a>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Application Received: ${programTitle}`,
    html
  });
};

/**
 * Send application status update email
 */
export const sendApplicationStatusUpdate = async (
  email: string,
  studentName: string,
  programTitle: string,
  status: 'approved' | 'rejected' | 'waitlisted',
  message?: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const statusMessages = {
    approved: {
      title: '🎉 Congratulations! You\'re In!',
      color: '#22c55e',
      text: 'Your application has been approved! Welcome to the program.'
    },
    rejected: {
      title: 'Application Update',
      color: '#ef4444',
      text: 'Unfortunately, we are unable to offer you a place in this program at this time.'
    },
    waitlisted: {
      title: 'You\'re on the Waitlist',
      color: '#f59e0b',
      text: 'You have been placed on our waitlist. We\'ll notify you if a spot becomes available.'
    }
  };

  const { title, color, text } = statusMessages[status];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <h2>Hi ${studentName},</h2>
          <p>${text}</p>
          <p><strong>Program:</strong> ${programTitle}</p>
          ${message ? `<p><strong>Additional Notes:</strong> ${message}</p>` : ''}
          ${status === 'approved' ? `
            <p>Please complete the following steps:</p>
            <ol>
              <li>Complete any pending payments (if applicable)</li>
              <li>Complete your onboarding tasks</li>
              <li>Join your assigned team</li>
            </ol>
            <a href="${process.env.CLIENT_ORIGIN}/portal/student/internships" class="btn">Get Started</a>
          ` : ''}
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Application Status: ${programTitle} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html
  });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (
  email: string,
  studentName: string,
  programTitle: string,
  amount: number,
  currency: string,
  invoiceNumber: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const formattedAmount = new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: currency
  }).format(amount);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${studentName},</h2>
          <p>Thank you for your payment! Your enrollment in <strong>${programTitle}</strong> is now confirmed.</p>
          
          <div class="receipt">
            <h3>Payment Receipt</h3>
            <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
            <p><strong>Program:</strong> ${programTitle}</p>
            <p><strong>Amount Paid:</strong> ${formattedAmount}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>You now have full access to the internship program. Log in to your portal to start your journey!</p>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Confirmed - ${programTitle}`,
    html
  });
};

/**
 * Send certificate issued email
 */
export const sendCertificateIssued = async (
  email: string,
  studentName: string,
  programTitle: string,
  certificateNumber: string,
  verificationUrl: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .certificate-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #d97706; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Certificate of Completion!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${studentName}! 🎉</h2>
          <p>You have successfully completed the <strong>${programTitle}</strong> internship program!</p>
          
          <div class="certificate-box">
            <h3>🎓 Your Certificate</h3>
            <p><strong>Certificate #:</strong> ${certificateNumber}</p>
            <p><strong>Program:</strong> ${programTitle}</p>
            <p><strong>Issued:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Your certificate can be verified at:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          
          <p>Share your achievement on LinkedIn and with potential employers!</p>
          
          <a href="${process.env.CLIENT_ORIGIN}/portal/student/certificates" class="btn">Download Certificate</a>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🏆 Certificate Issued - ${programTitle}`,
    html
  });
};

/**
 * Send course enrollment confirmation email
 */
export const sendCourseEnrollmentConfirmation = async (
  email: string,
  studentName: string,
  courseTitle: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .course-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
        .steps { padding-left: 20px; }
        .steps li { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Your Course!</h1>
        </div>
        <div class="content">
          <h2>Hi ${studentName},</h2>
          <p>Congratulations! You have been successfully enrolled in:</p>
          
          <div class="course-box">
            <h3>📚 ${courseTitle}</h3>
          </div>
          
          <p>Your learning journey starts now! Here's what you can do next:</p>
          <ol class="steps">
            <li><strong>Access your dashboard</strong> — Start exploring your course materials</li>
            <li><strong>Complete your first lesson</strong> — Begin with the first module</li>
            <li><strong>Track your progress</strong> — Monitor your completion and achievements</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_ORIGIN}/portal/student/dashboard" class="btn">Go to My Dashboard</a>
          </div>
          
          <p style="margin-top: 20px;">If you have any questions, feel free to reach out to your instructor or our support team.</p>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎓 Enrolled in ${courseTitle} - Welcome!`,
    html
  });
};

/**
 * Send new feedback notification
 */
export const sendFeedbackNotification = async (
  email: string,
  studentName: string,
  mentorName: string,
  projectTitle: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Feedback Received</h1>
        </div>
        <div class="content">
          <h2>Hi ${studentName},</h2>
          <p><strong>${mentorName}</strong> has provided feedback on your work for <strong>${projectTitle}</strong>.</p>
          <p>Log in to view the feedback and continue improving your skills!</p>
          <a href="${process.env.CLIENT_ORIGIN}/portal/student/internships" class="btn">View Feedback</a>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `New Feedback: ${projectTitle}`,
    html
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const config = await getEmailConfig();
  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>We received a request to reset the password for your Bootskills Academy account.</p>
          <p>If you made this request, please click the button below to choose a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          
          <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <div class="warning">
            <p><strong>Note:</strong> This link will expire in 1 hour.</p>
          </div>
          
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Bootskills Academy',
    html
  });
};

/**
 * Send Login OTP (2FA) Email
 */
export const sendLoginOTPEmail = async (email: string, code: string): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; }
        .header { background: #000; color: #EAB308; padding: 40px 20px; text-align: center; }
        .content { background: #ffffff; padding: 40px; }
        .otp-code { 
          font-family: 'Courier New', Courier, monospace;
          font-size: 42px; 
          font-weight: bold; 
          color: #EAB308; 
          letter-spacing: 8px; 
          text-align: center; 
          padding: 24px; 
          background: #fdfae5; 
          border: 2px dashed #EAB308;
          border-radius: 8px;
          margin: 30px 0;
        }
        .footer { background: #f8f9fa; padding: 24px; text-align: center; color: #6c757d; font-size: 13px; }
        .warning { color: #856404; background-color: #fff3cd; padding: 12px; border-radius: 6px; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">BOOTSKILLS ACADEMY</h1>
        </div>
        <div class="content">
          <h2 style="margin-top: 0; color: #1a1a1a;">Verification Code</h2>
          <p>Please enter the following 6-digit code to verify your identity and complete your sign-in to the portal.</p>
          
          <div class="otp-code">${code}</div>
          
          <p>This code will expire in <strong>5 minutes</strong>. If you did not request this code, please ignore this email or contact support if you suspect unauthorized access.</p>
          
          <div class="warning">
            <strong>Security Tip:</strong> Never share your verification code with anyone. Our team will never ask for this code.
          </div>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. All rights reserved.</p>
          <p>Building Africa's Tech Talent.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${code} is your verification code for ${config.siteName}`,
    html
  });
};

/**
 * Send broadcast/announcement email — used for bulk notifications and scheduled broadcasts
 */
export const sendBroadcastAnnouncement = async (
  email: string,
  recipientName: string,
  title: string,
  message: string,
  link?: string | null
): Promise<boolean> => {
  const config = await getEmailConfig();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px 10px; }
        .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { 
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 50%, #B08D2A 100%); 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .header .logo-text { color: rgba(255,255,255,0.85); font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; font-weight: 400; }
        .content { padding: 35px 30px; }
        .content h2 { margin: 0 0 16px; font-size: 20px; color: #1a1a1a; font-weight: 600; }
        .message-box { 
          background: #fafaf9; 
          padding: 24px; 
          border-radius: 12px; 
          margin: 20px 0; 
          border-left: 4px solid #D4AF37;
          font-size: 15px;
          color: #444;
          line-height: 1.7;
        }
        .btn-wrapper { text-align: center; margin: 28px 0 8px; }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
          color: #ffffff !important;
          padding: 14px 36px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
        }
        .btn:hover { box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4); }
        .divider { height: 1px; background: #e5e5e5; margin: 24px 0; }
        .footer-text { font-size: 13px; color: #888; text-align: center; line-height: 1.5; margin-top: 20px; }
        .footer-text a { color: #D4AF37; text-decoration: none; }
        @media only screen and (max-width: 480px) {
          .header { padding: 30px 20px; }
          .header h1 { font-size: 22px; }
          .content { padding: 25px 20px; }
          .btn { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>📢 ${title}</h1>
            <div class="logo-text">${config.siteName}</div>
          </div>
          <div class="content">
            <h2>Hi ${recipientName},</h2>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
            ${link ? `
              <div class="btn-wrapper">
                <a href="${link}" class="btn">View Details</a>
              </div>
            ` : ''}
            <div class="divider"></div>
            <p style="margin: 0; font-size: 14px; color: #666;">
              This is an official announcement from the <strong>${config.siteName}</strong> Admin Team.
              ${link ? `If the button above doesn't work, copy this link into your browser:<br><a href="${link}" style="color:#D4AF37;word-break:break-all;">${link}</a>` : ''}
            </p>
          </div>
        </div>
        <div class="footer-text">
          <p>© 2026 ${config.siteName}. All rights reserved.</p>
          <p>Building Africa's Tech Talent.</p>
          <p style="margin-top: 12px; font-size: 12px; color: #aaa;">
            You received this email because you are registered with ${config.siteName}.
            If you have questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `📢 ${title}`,
    html
  });
};

/**
 * Send email when developer submits task feedback / resources
 */
export const sendTaskFeedbackEmail = async (
  mentorEmail: string,
  mentorName: string,
  developerName: string,
  projectTitle: string,
  taskTitle: string,
  message: string,
  resources?: { title: string; url: string }[]
): Promise<boolean> => {
  const config = await getEmailConfig();
  const resourcesHtml = resources && resources.length > 0
    ? `<h3>Attached Resources:</h3>
       <ul>
         ${resources.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title}</a></li>`).join('')}
       </ul>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .feedback-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Task Feedback Submitted</h1>
        </div>
        <div class="content">
          <h2>Hi ${mentorName},</h2>
          <p>Developer <strong>${developerName}</strong> has submitted feedback/resources for the task <strong>"${taskTitle}"</strong> under the project <strong>"${projectTitle}"</strong>.</p>
          
          <div class="feedback-box">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; font-style: italic;">"${message}"</p>
          </div>
          
          ${resourcesHtml}
          
          <p>Please review the task status and developer submission in the portal.</p>
          <a href="${process.env.CLIENT_ORIGIN}/portal/trainer/projects" class="btn">View Project Board</a>
        </div>
        <div class="footer">
          <p>© 2026 ${config.siteName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: mentorEmail,
    subject: `Task Update: ${developerName} submitted feedback for "${taskTitle}"`,
    html
  });
};

export default {
  sendEmail,
  sendApplicationConfirmation,
  sendApplicationStatusUpdate,
  sendPaymentConfirmation,
  sendCertificateIssued,
  sendFeedbackNotification,
  sendPasswordResetEmail,
  sendLoginOTPEmail,
  sendWelcomeEmail,
  sendAdminNewUserNotification,
  sendMeetingInvitation,
  sendCourseEnrollmentConfirmation,
  sendTaskFeedbackEmail,
  sendBroadcastAnnouncement
};
