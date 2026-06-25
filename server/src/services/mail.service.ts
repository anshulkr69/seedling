import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email notification.
 * Uses Resend SMTP if RESEND_API_KEY is configured; otherwise logs the email body to the console.
 */
export async function sendEmail({ to, subject, html }: SendMailOptions): Promise<{ success: boolean; mocked?: boolean }> {
  console.log(`[Email Service] Attempting to send email to: ${to}`);
  console.log(`[Email Service] Subject: ${subject}`);

  if (!env.RESEND_API_KEY) {
    console.log(`[Email Service] ℹ️ No RESEND_API_KEY configured. Fallback to logging email body:`);
    console.log(`--------------------------------------------------`);
    console.log(html);
    console.log(`--------------------------------------------------`);
    return { success: true, mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: env.RESEND_API_KEY,
      },
    });

    await transporter.sendMail({
      from: env.EMAIL_FROM_ADDRESS,
      to,
      subject,
      html,
    });

    console.log(`[Email Service] ✅ Email sent successfully to ${to}`);
    return { success: true };
  } catch (err) {
    console.error('[Email Service] ❌ Failed to send email via SMTP:', err);
    throw err;
  }
}
