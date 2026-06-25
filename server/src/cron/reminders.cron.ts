import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { sendEmail } from '../services/mail.service.js';

/**
 * Checks all active applications and sends email reminders to their owners
 * if the grant deadline is exactly 30, 7, or 1 day(s) away.
 */
export async function checkDeadlinesAndSendReminders(): Promise<void> {
  console.log('[Cron Reminders] Running daily deadline check...');
  try {
    // 1. Fetch all applications in Exploring/Drafting status with inner joined grants and organizations
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('id, status, grants (id, title, funder, deadline), organizations (id, name, user_id)')
      .in('status', ['Exploring', 'Drafting']);

    if (error) {
      console.error('[Cron Reminders] Error fetching applications:', error.message);
      return;
    }

    if (!applications || applications.length === 0) {
      console.log('[Cron Reminders] No active applications found.');
      return;
    }

    console.log(`[Cron Reminders] Scanning ${applications.length} active application(s)...`);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let notificationsSent = 0;

    for (const app of applications) {
      const grant = app.grants as any;
      const org = app.organizations as any;

      if (!grant || !grant.deadline) continue;
      if (!org || !org.user_id) continue;

      const deadlineDate = new Date(grant.deadline);
      const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

      const diffTime = deadlineStart.getTime() - todayStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Trigger reminder if exactly 30, 7, or 1 day remains
      if (diffDays === 30 || diffDays === 7 || diffDays === 1) {
        console.log(`[Cron Reminders] Application ${app.id} for "${grant.title}" is due in ${diffDays} day(s). Fetching owner email...`);

        // Get user details from Supabase Auth admin
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(org.user_id);
        
        if (userError || !userData?.user?.email) {
          console.error(`[Cron Reminders] Failed to retrieve email for user ${org.user_id}:`, userError?.message);
          continue;
        }

        const email = userData.user.email;
        const appUrl = `${env.CLIENT_URL}/applications/${app.id}`;
        const subject = `Reminder: Only ${diffDays} day${diffDays > 1 ? 's' : ''} left to submit proposal for ${grant.title}`;
        
        const html = `
          <div style="font-family: sans-serif; padding: 20px; color: #1f2937; max-width: 600px; border: 1px solid #e5e7eb; rounded: 8px;">
            <h2 style="color: #10B981; font-family: sans-serif; margin-bottom: 16px;">Seedling Submission Reminder</h2>
            <p>Hello <strong>${org.name || 'Team'}</strong>,</p>
            <p>This is an automated notification regarding your proposal for the following grant opportunity:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px;">Grant:</td>
                <td style="padding: 8px 0;">${grant.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Funder:</td>
                <td style="padding: 8px 0;">${grant.funder}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Deadline:</td>
                <td style="padding: 8px 0; color: #DC2626; font-weight: 600;">
                  ${deadlineDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Time Left:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #DC2626;">${diffDays} day${diffDays > 1 ? 's' : ''} remaining</td>
              </tr>
            </table>

            <p style="margin-bottom: 24px;">Please complete any outstanding items on your compliance checklist and submit your proposal workspace draft before the deadline.</p>
            
            <a href="${appUrl}" style="background-color: #13241F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Open Proposal Workspace
            </a>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
            <p style="font-size: 11px; color: #6b7280; text-align: center;">This is an automated reminder from Seedling. Please do not reply directly to this email.</p>
          </div>
        `;

        try {
          await sendEmail({ to: email, subject, html });
          notificationsSent++;
        } catch (mailErr) {
          console.error(`[Cron Reminders] Failed to send email to ${email}:`, mailErr);
        }
      }
    }

    console.log(`[Cron Reminders] Deadline scan finished. Sent ${notificationsSent} notification(s).`);
  } catch (err) {
    console.error('[Cron Reminders] Critical error during scan:', err);
  }
}

/**
 * Registers and starts all backend cron jobs.
 */
export function startCronJobs(): void {
  console.log(`[Cron] Initializing reminder cron on schedule: "${env.CRON_SCHEDULE_REMINDERS}"`);
  
  // Register the daily reminders check
  cron.schedule(env.CRON_SCHEDULE_REMINDERS, async () => {
    await checkDeadlinesAndSendReminders();
  });
  
  // Also run immediately on boot in development to confirm initialization
  if (env.NODE_ENV === 'development') {
    console.log('[Cron] Development mode: Triggering immediate deadline check on startup.');
    checkDeadlinesAndSendReminders();
  }
}
