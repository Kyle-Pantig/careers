import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'Careers Platform';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

// Base email template wrapper
function emailTemplate(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Careers Platform</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding: 40px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">
                © ${new Date().getFullYear()} Careers Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
      Verify your email
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 15px; color: #52525b; text-align: center; line-height: 1.6;">
      Thanks for signing up! Click the button below to verify your email address and get started.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #71717a; text-align: center;">
        Or use this link to verify your email:
      </p>
      <p style="margin: 0; text-align: center;">
        <a href="${verifyUrl}" style="font-size: 13px; color: #3b82f6; text-decoration: underline; word-break: break-all;">
          ${verifyUrl}
        </a>
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; text-align: center;">
      This link expires in 24 hours.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your email',
    html: emailTemplate(content),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
      Reset your password
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 15px; color: #52525b; text-align: center; line-height: 1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #71717a; text-align: center;">
        Or use this link to reset your password:
      </p>
      <p style="margin: 0; text-align: center;">
        <a href="${resetUrl}" style="font-size: 13px; color: #3b82f6; text-decoration: underline; word-break: break-all;">
          ${resetUrl}
        </a>
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; text-align: center;">
      This link expires in 1 hour.
    </p>
    
    <div style="margin-top: 24px; padding: 16px; background-color: #fafafa; border-radius: 8px;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your password',
    html: emailTemplate(content),
  });
}

export async function sendMagicLinkEmail(email: string, token: string) {
  const loginUrl = `${APP_URL}/auth/magic-link?token=${token}`;

  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
      Sign in to Careers Platform
    </h1>
    <p style="margin: 0 0 32px 0; font-size: 15px; color: #52525b; text-align: center; line-height: 1.6;">
      Click the button below to securely sign in to your account. No password required!
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
            Sign In
          </a>
        </td>
      </tr>
    </table>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #71717a; text-align: center;">
        Or use this link to sign in:
      </p>
      <p style="margin: 0; text-align: center;">
        <a href="${loginUrl}" style="font-size: 13px; color: #3b82f6; text-decoration: underline; word-break: break-all;">
          ${loginUrl}
        </a>
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; text-align: center;">
      This link expires in 15 minutes for security.
    </p>
    
    <div style="margin-top: 24px; padding: 16px; background-color: #fafafa; border-radius: 8px;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your sign-in link for Careers Platform',
    html: emailTemplate(content),
  });
}

export interface ApplicationConfirmationData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobNumber: string;
  companyLocation: string;
}

export async function sendApplicationConfirmationEmail(data: ApplicationConfirmationData) {
  const jobUrl = `${APP_URL}/jobs/${data.jobNumber}`;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #18181b;">
        Application Received!
      </h1>
      <p style="margin: 0; font-size: 15px; color: #52525b;">
        Thank you for applying, ${data.applicantName}
      </p>
    </div>
    
    <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">
        Position Applied For
      </p>
      <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #18181b;">
        ${data.jobTitle}
      </h2>
      <p style="margin: 0; font-size: 14px; color: #52525b;">
        ${data.companyLocation} • ${data.jobNumber}
      </p>
    </div>
    
    <div style="margin-bottom: 32px;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #18181b;">
        What happens next?
      </h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 28px; vertical-align: top;">
                  <div style="width: 20px; height: 20px; background-color: #18181b; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">1</div>
                </td>
                <td style="padding-left: 12px;">
                  <p style="margin: 0; font-size: 14px; color: #18181b; font-weight: 500;">Application Review</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">Our team will carefully review your application and resume.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 28px; vertical-align: top;">
                  <div style="width: 20px; height: 20px; background-color: #18181b; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">2</div>
                </td>
                <td style="padding-left: 12px;">
                  <p style="margin: 0; font-size: 14px; color: #18181b; font-weight: 500;">Initial Screening</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">If your profile matches our requirements, we'll reach out for a screening call.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 28px; vertical-align: top;">
                  <div style="width: 20px; height: 20px; background-color: #18181b; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; line-height: 20px;">3</div>
                </td>
                <td style="padding-left: 12px;">
                  <p style="margin: 0; font-size: 14px; color: #18181b; font-weight: 500;">Interview Process</p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">Selected candidates will be invited to participate in interviews.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="${jobUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
            View Job Details
          </a>
        </td>
      </tr>
    </table>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
        We appreciate your interest in joining our team. We'll be in touch soon with updates on your application status.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.applicantEmail,
    subject: `Application Received - ${data.jobTitle}`,
    html: emailTemplate(content),
  });
}

// Send custom email to applicant
interface CustomEmailData {
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
  jobTitle?: string;
  jobNumber?: string;
}

export async function sendCustomEmail(data: CustomEmailData) {
  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
      ${data.subject}
    </h1>
    
    ${data.jobTitle ? `
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #71717a;">
      Regarding: ${data.jobTitle} ${data.jobNumber ? `(${data.jobNumber})` : ''}
    </p>
    ` : ''}
    
    <div style="margin: 24px 0; font-size: 14px; color: #18181b; line-height: 1.7; white-space: pre-wrap;">
${data.message}
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
        This email was sent by ${FROM_NAME}. Please do not reply directly to this email.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.toEmail,
    subject: data.subject,
    html: emailTemplate(content),
  });
}

// Built-in email templates
export type EmailTemplateType = 'interview_invitation' | 'rejection' | 'offer' | 'follow_up';

interface TemplateEmailData {
  toEmail: string;
  toName: string;
  jobTitle: string;
  jobNumber: string;
  templateType: EmailTemplateType;
  customData?: {
    interviewDate?: string;
    interviewTime?: string;
    interviewLocation?: string;
    interviewType?: string;
    additionalNotes?: string;
    // Offer template fields
    salaryAmount?: string;
    salaryCurrency?: string;
    salaryPeriod?: string;
    startDate?: string;
  };
}

export async function sendTemplateEmail(data: TemplateEmailData) {
  let subject = '';
  let content = '';
  
  const greeting = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">
      Dear ${data.toName},
    </p>
  `;
  
  const jobInfo = `
    <p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">
      Position: <strong style="color: #18181b;">${data.jobTitle}</strong> (${data.jobNumber})
    </p>
  `;
  
  const footer = `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
        If you have any questions, please don't hesitate to reach out.
      </p>
    </div>
  `;

  switch (data.templateType) {
    case 'interview_invitation':
      subject = `Interview Invitation - ${data.jobTitle}`;
      content = `
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
          Interview Invitation
        </h1>
        ${greeting}
        ${jobInfo}
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We are pleased to inform you that your application has been shortlisted, and we would like to invite you to an interview.
        </p>
        
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #18181b;">
            Interview Details
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="font-size: 14px;">
            ${data.customData?.interviewDate ? `
            <tr>
              <td style="color: #71717a; padding: 4px 16px 4px 0;">Date:</td>
              <td style="color: #18181b; font-weight: 500;">${data.customData.interviewDate}</td>
            </tr>
            ` : ''}
            ${data.customData?.interviewTime ? `
            <tr>
              <td style="color: #71717a; padding: 4px 16px 4px 0;">Time:</td>
              <td style="color: #18181b; font-weight: 500;">${data.customData.interviewTime}</td>
            </tr>
            ` : ''}
            ${data.customData?.interviewType ? `
            <tr>
              <td style="color: #71717a; padding: 4px 16px 4px 0;">Format:</td>
              <td style="color: #18181b; font-weight: 500;">${data.customData.interviewType}</td>
            </tr>
            ` : ''}
            ${data.customData?.interviewLocation ? `
            <tr>
              <td style="color: #71717a; padding: 4px 16px 4px 0;">Location:</td>
              <td style="color: #18181b; font-weight: 500;">${data.customData.interviewLocation}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        ${data.customData?.additionalNotes ? `
        <p style="margin: 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          ${data.customData.additionalNotes}
        </p>
        ` : ''}
        
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          Please confirm your attendance by replying to this email or contacting us.
        </p>
        ${footer}
      `;
      break;

    case 'rejection':
      subject = `Thank You for Applying - ${data.jobTitle}`;
      content = `
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
          Thank You for Your Application
        </h1>
        ${greeting}
        ${jobInfo}
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          Thank you for taking the time to apply for the ${data.jobTitle} position and for your interest in joining our team. We truly appreciate the effort you put into your application.
        </p>
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          After careful consideration, we have decided to move forward with candidates whose qualifications more closely align with our current needs for this specific role. This was a difficult decision, as we received many impressive applications.
        </p>
        
        <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #854d0e; font-weight: 500;">
            Don't be discouraged!
          </p>
          <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.5;">
            This decision does not reflect on your abilities or potential. The job market is highly competitive, and the right opportunity for you is out there.
          </p>
        </div>
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We encourage you to:
        </p>
        
        <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; color: #18181b; line-height: 1.8;">
          <li>Keep an eye on our careers page for future opportunities that match your skills</li>
          <li>Continue developing your expertise in your field</li>
          <li>Apply again in the future – we'd love to hear from you</li>
        </ul>
        
        ${data.customData?.additionalNotes ? `
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          ${data.customData.additionalNotes}
        </p>
        ` : ''}
        
        <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We wish you all the best in your career journey and future endeavors. Thank you again for considering us as a potential employer.
        </p>
        
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
          <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
            Warm regards,<br>
            The Hiring Team
          </p>
        </div>
      `;
      break;

    case 'offer':
      subject = `Job Offer - ${data.jobTitle}`;
      
      // Format salary if provided
      const currencySymbols: Record<string, string> = {
        'PHP': '₱', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'AUD': 'A$', 'CAD': 'C$', 'SGD': 'S$',
      };
      const periodLabels: Record<string, string> = {
        'HOURLY': 'per hour', 'MONTHLY': 'per month', 'YEARLY': 'per year',
      };
      
      const hasSalary = data.customData?.salaryAmount;
      const salaryDisplay = hasSalary ? `${currencySymbols[data.customData?.salaryCurrency || 'PHP'] || '₱'}${Number(data.customData?.salaryAmount).toLocaleString()} ${periodLabels[data.customData?.salaryPeriod || 'MONTHLY'] || 'per month'}` : null;
      
      content = `
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
          Congratulations! 🎉
        </h1>
        ${greeting}
        ${jobInfo}
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We are pleased to offer you the <strong>${data.jobTitle}</strong> position! Your qualifications and experience impressed us throughout the interview process.
        </p>
        
        ${hasSalary ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #166534; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
            Compensation Package
          </p>
          <p style="margin: 0; font-size: 24px; color: #15803d; font-weight: 600;">
            ${salaryDisplay}
          </p>
          ${data.customData?.startDate ? `
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #166534;">
            <strong>Proposed Start Date:</strong> ${data.customData.startDate}
          </p>
          ` : ''}
        </div>
        ` : `
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          Please expect to receive the formal offer letter with complete details about compensation, benefits, and start date shortly.
        </p>
        `}
        
        ${data.customData?.additionalNotes ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; font-weight: 500;">
            Additional Information
          </p>
          <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">
            ${data.customData.additionalNotes}
          </p>
        </div>
        ` : ''}
        
        <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We look forward to welcoming you to our team!
        </p>
        ${footer}
      `;
      break;

    case 'follow_up':
      subject = `Following Up - ${data.jobTitle}`;
      content = `
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
          Application Status Update
        </h1>
        ${greeting}
        ${jobInfo}
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We wanted to follow up regarding your application for the ${data.jobTitle} position.
        </p>
        
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          Your application is still under review, and we appreciate your patience during our selection process. We have received many applications and are carefully evaluating each candidate.
        </p>
        
        ${data.customData?.additionalNotes ? `
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          ${data.customData.additionalNotes}
        </p>
        ` : ''}
        
        <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">
          We will be in touch with an update as soon as possible.
        </p>
        ${footer}
      `;
      break;
  }

  await resend.emails.send({
    from: FROM,
    to: data.toEmail,
    subject,
    html: emailTemplate(content),
  });
}

// Send application reviewed notification
interface ApplicationReviewedData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobNumber: string;
}

export async function sendApplicationReviewedEmail(data: ApplicationReviewedData) {
  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
      Application Update
    </h1>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">
      Dear ${data.applicantName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">
      Position: <strong style="color: #18181b;">${data.jobTitle}</strong> (${data.jobNumber})
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      Thank you for your patience. We wanted to let you know that your application has been reviewed by our hiring team.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 500;">
        ✓ Your application is now under active consideration
      </p>
    </div>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      Our team is carefully evaluating all candidates, and we will be in touch with you regarding the next steps in our selection process.
    </p>
    
    <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      We appreciate your interest in joining our team and thank you for your continued patience.
    </p>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
        If you have any questions, please don't hesitate to reach out.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.applicantEmail,
    subject: `Application Update - ${data.jobTitle}`,
    html: emailTemplate(content),
  });
}

// Send application rejection notification (compassionate and professional)
interface ApplicationRejectionData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobNumber: string;
}

export async function sendApplicationRejectionEmail(data: ApplicationRejectionData) {
  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">
      Thank You for Your Application
    </h1>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">
      Dear ${data.applicantName},
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">
      Position: <strong style="color: #18181b;">${data.jobTitle}</strong> (${data.jobNumber})
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      Thank you for taking the time to apply for the ${data.jobTitle} position and for your interest in joining our team. We truly appreciate the effort you put into your application.
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      After careful consideration, we have decided to move forward with candidates whose qualifications more closely align with our current needs for this specific role. This was a difficult decision, as we received many impressive applications.
    </p>
    
    <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #854d0e; font-weight: 500;">
        Don't be discouraged!
      </p>
      <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.5;">
        This decision does not reflect on your abilities or potential. The job market is highly competitive, and the right opportunity for you is out there.
      </p>
    </div>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      We encourage you to:
    </p>
    
    <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; color: #18181b; line-height: 1.8;">
      <li>Keep an eye on our careers page for future opportunities that match your skills</li>
      <li>Continue developing your expertise in your field</li>
      <li>Apply again in the future – we'd love to hear from you</li>
    </ul>
    
    <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">
      We wish you all the best in your career journey and future endeavors. Thank you again for considering us as a potential employer.
    </p>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
        Warm regards,<br>
        The Hiring Team
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.applicantEmail,
    subject: `Thank You for Applying - ${data.jobTitle}`,
    html: emailTemplate(content),
  });
}
