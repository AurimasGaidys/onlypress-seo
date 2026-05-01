// src/lib/email.ts
import sgMail from '@sendgrid/mail';

export interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    
    // Nustatome SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    
    const msg = {
      to: data.to,
      from: data.from || 'info@publikuota.lt',
      subject: data.subject,
      text: data.text,
      html: data.html || data.text,
    };

    await sgMail.send(msg as any);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

export function generateInviteEmailTemplate(
  agencyName: string, 
  inviterName: string,
  inviteLink: string,
  isExistingUser?: boolean
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to join ${agencyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .content { background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        .registration-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You're invited!</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${agencyName}</strong> on Publikuota.lt.</p>
          
          <div class="registration-info">
            <p><strong>📋 Registration Information:</strong></p>
            ${isExistingUser 
              ? `<p>You already have a Publikuota.lt account. Click the button below to accept the invitation and join the team.</p>`
              : `<p>You don't have a Publikuota.lt account yet. Click the button below to create your account and join the team.</p>`
            }
          </div>
          
          <div style="text-align: center;">
            <a href="${inviteLink}" class="button">Accept Invitation</a>
          </div>
          
          <p><em>This invitation link will expire in 7 days.</em></p>
          <p>If you have any questions, please contact the person who invited you.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Publikuota.lt. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmailTemplate(
  userName: string,
  agencyName: string,
  agencyId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${agencyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .content { background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        .welcome-info { background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome Aboard!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Welcome to <strong>${agencyName}</strong>! Your account has been successfully created and you're now part of the team.</p>
          
          <div class="welcome-info">
            <p><strong>🚀 Getting Started:</strong></p>
            <p>You can now access your agency dashboard and collaborate with your team members. Click the button below to get started.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/agency/${agencyId}" class="button">Go to Agency Dashboard</a>
          </div>
          
          <p>If you have any questions or need assistance, feel free to reach out to your team administrator.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Publikuota.lt. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
