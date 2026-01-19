import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../lib/auth';

const prisma = new PrismaClient();

// Email template types for application-related emails
const EMAIL_TEMPLATE_TYPES = [
  'APPLICATION_CONFIRMATION',
  'APPLICATION_REVIEWED',
  'APPLICATION_REJECTION',
  'INTERVIEW_INVITATION',
  'JOB_OFFER',
  'APPLICATION_FOLLOW_UP',
] as const;

type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

// Placeholder information for each template type
const TEMPLATE_PLACEHOLDERS: Record<EmailTemplateType, { name: string; description: string }[]> = {
  APPLICATION_CONFIRMATION: [
    { name: '{{applicantName}}', description: 'Full name of the applicant' },
    { name: '{{jobTitle}}', description: 'Title of the job' },
    { name: '{{jobNumber}}', description: 'Job reference number' },
    { name: '{{companyLocation}}', description: 'Location of the job' },
    { name: '{{jobUrl}}', description: 'URL to view the job details' },
  ],
  APPLICATION_REVIEWED: [
    { name: '{{applicantName}}', description: 'Full name of the applicant' },
    { name: '{{jobTitle}}', description: 'Title of the job' },
    { name: '{{jobNumber}}', description: 'Job reference number' },
  ],
  APPLICATION_REJECTION: [
    { name: '{{applicantName}}', description: 'Full name of the applicant' },
    { name: '{{jobTitle}}', description: 'Title of the job' },
    { name: '{{jobNumber}}', description: 'Job reference number' },
  ],
  INTERVIEW_INVITATION: [
    { name: '{{applicantName}}', description: 'Full name of the applicant' },
    { name: '{{jobTitle}}', description: 'Title of the job' },
    { name: '{{jobNumber}}', description: 'Job reference number' },
    { name: '{{interviewDate}}', description: 'Date of the interview' },
    { name: '{{interviewTime}}', description: 'Time of the interview' },
    { name: '{{interviewType}}', description: 'Type/format of interview (e.g., Video Call, In-Person)' },
    { name: '{{interviewLocation}}', description: 'Location or link for the interview' },
    { name: '{{additionalNotes}}', description: 'Any additional notes (optional)' },
  ],
  JOB_OFFER: [
    { name: '{{applicantName}}', description: 'Full name of the applicant' },
    { name: '{{jobTitle}}', description: 'Title of the job' },
    { name: '{{jobNumber}}', description: 'Job reference number' },
    { name: '{{salaryDisplay}}', description: 'Formatted salary (e.g., ₱50,000 per month)' },
    { name: '{{startDate}}', description: 'Proposed start date' },
    { name: '{{additionalNotes}}', description: 'Any additional notes (optional)' },
  ],
  APPLICATION_FOLLOW_UP: [
    { name: '{{applicantName}}', description: 'Full name of the applicant' },
    { name: '{{jobTitle}}', description: 'Title of the job' },
    { name: '{{jobNumber}}', description: 'Job reference number' },
    { name: '{{additionalNotes}}', description: 'Any additional notes (optional)' },
  ],
};

export const emailTemplateRoutes = new Elysia({ prefix: '/email-templates' })
  // Get all email templates (admin only)
  .get('/', async ({ cookie, set }) => {
    const token = cookie.token?.value;
    if (!token) {
      set.status = 401;
      return { error: 'Not authenticated' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const isAdmin = user.roles.some((ur) => ur.role.name === 'admin');
    if (!isAdmin) {
      set.status = 403;
      return { error: 'Admin access required' };
    }

    const templates = await (prisma as any).emailTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return {
      templates,
      placeholders: TEMPLATE_PLACEHOLDERS,
    };
  })

  // Get single email template by type (admin only)
  .get('/:type', async ({ params, cookie, set }) => {
    const token = cookie.token?.value;
    if (!token) {
      set.status = 401;
      return { error: 'Not authenticated' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const isAdmin = user.roles.some((ur) => ur.role.name === 'admin');
    if (!isAdmin) {
      set.status = 403;
      return { error: 'Admin access required' };
    }

    const templateType = params.type.toUpperCase();
    
    if (!EMAIL_TEMPLATE_TYPES.includes(templateType as EmailTemplateType)) {
      set.status = 400;
      return { error: 'Invalid template type' };
    }

    const template = await (prisma as any).$queryRaw`
      SELECT * FROM email_templates WHERE type = ${templateType}::"EmailTemplateType"
    `;

    if (!template || (template as any[]).length === 0) {
      set.status = 404;
      return { error: 'Template not found' };
    }

    return {
      template: (template as any[])[0],
      placeholders: TEMPLATE_PLACEHOLDERS[templateType as EmailTemplateType],
    };
  })

  // Update email template (admin only)
  .patch(
    '/:id',
    async ({ params, body, cookie, set }) => {
      const token = cookie.token?.value;
      if (!token) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }

      const payload = verifyToken(token);
      if (!payload) {
        set.status = 401;
        return { error: 'Invalid token' };
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { roles: { include: { role: true } } },
      });

      if (!user) {
        set.status = 404;
        return { error: 'User not found' };
      }

      const isAdmin = user.roles.some((ur) => ur.role.name === 'admin');
      if (!isAdmin) {
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const { subject, body: templateBody, isActive } = body as {
        subject?: string;
        body?: string;
        isActive?: boolean;
      };

      // Build update query dynamically
      const updateData: Record<string, any> = {};
      if (subject !== undefined) updateData.subject = subject;
      if (templateBody !== undefined) updateData.body = templateBody;
      if (isActive !== undefined) updateData.isActive = isActive;

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { error: 'No fields to update' };
      }

      try {
        const template = await (prisma as any).emailTemplate.update({
          where: { id: params.id },
          data: updateData,
        });

        return {
          success: true,
          message: 'Template updated successfully',
          template,
        };
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404;
          return { error: 'Template not found' };
        }
        throw error;
      }
    },
    {
      body: t.Object({
        subject: t.Optional(t.String()),
        body: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // Toggle template active status (admin only)
  .patch('/:id/toggle', async ({ params, cookie, set }) => {
    const token = cookie.token?.value;
    if (!token) {
      set.status = 401;
      return { error: 'Not authenticated' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const isAdmin = user.roles.some((ur) => ur.role.name === 'admin');
    if (!isAdmin) {
      set.status = 403;
      return { error: 'Admin access required' };
    }

    try {
      // Get current template
      const currentTemplate = await (prisma as any).emailTemplate.findUnique({
        where: { id: params.id },
      });

      if (!currentTemplate) {
        set.status = 404;
        return { error: 'Template not found' };
      }

      // Toggle the isActive status
      const template = await (prisma as any).emailTemplate.update({
        where: { id: params.id },
        data: { isActive: !currentTemplate.isActive },
      });

      return {
        success: true,
        message: `Template ${template.isActive ? 'enabled' : 'disabled'} successfully`,
        template,
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        set.status = 404;
        return { error: 'Template not found' };
      }
      throw error;
    }
  })

  // Reset template to default (admin only)
  .post('/:id/reset', async ({ params, cookie, set }) => {
    const token = cookie.token?.value;
    if (!token) {
      set.status = 401;
      return { error: 'Not authenticated' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const isAdmin = user.roles.some((ur) => ur.role.name === 'admin');
    if (!isAdmin) {
      set.status = 403;
      return { error: 'Admin access required' };
    }

    // Get template type first
    const currentTemplate = await (prisma as any).emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!currentTemplate) {
      set.status = 404;
      return { error: 'Template not found' };
    }

    // Default templates (same as seed data)
    const defaultTemplates = getDefaultTemplates();
    const defaultTemplate = defaultTemplates.find((t) => t.type === currentTemplate.type);

    if (!defaultTemplate) {
      set.status = 500;
      return { error: 'Default template not found' };
    }

    // Reset to default
    const template = await (prisma as any).emailTemplate.update({
      where: { id: params.id },
      data: {
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'Template reset to default successfully',
      template,
    };
  });

// Helper function to get default templates
function getDefaultTemplates() {
  return [
    {
      type: 'APPLICATION_CONFIRMATION',
      name: 'Application Confirmation',
      subject: 'Application Received - {{jobTitle}}',
      body: `<div style="text-align: center; margin-bottom: 32px;">
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
    Thank you for applying, {{applicantName}}
  </p>
</div>

<div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
  <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">
    Position Applied For
  </p>
  <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #18181b;">
    {{jobTitle}}
  </h2>
  <p style="margin: 0; font-size: 14px; color: #52525b;">
    {{companyLocation}} • {{jobNumber}}
  </p>
</div>

<div style="margin-bottom: 32px;">
  <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #18181b;">
    What happens next?
  </h3>
  <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;">1. Application Review - Our team will review your application</p>
  <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;">2. Initial Screening - We'll reach out if your profile matches</p>
  <p style="margin: 0; font-size: 14px; color: #52525b;">3. Interview Process - Selected candidates will be invited to interviews</p>
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td align="center">
      <a href="{{jobUrl}}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
        View Job Details
      </a>
    </td>
  </tr>
</table>`,
    },
    {
      type: 'APPLICATION_REVIEWED',
      name: 'Application Reviewed',
      subject: 'Application Update - {{jobTitle}}',
      body: `<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">Application Update</h1>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">Dear {{applicantName}},</p>
<p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">Position: <strong style="color: #18181b;">{{jobTitle}}</strong> ({{jobNumber}})</p>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">Your application has been reviewed by our hiring team.</p>
<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 500;">✓ Your application is now under active consideration</p>
</div>
<p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.6;">We will be in touch with you regarding the next steps.</p>`,
    },
    {
      type: 'APPLICATION_REJECTION',
      name: 'Application Rejection',
      subject: 'Thank You for Applying - {{jobTitle}}',
      body: `<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">Thank You for Your Application</h1>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">Dear {{applicantName}},</p>
<p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">Position: <strong style="color: #18181b;">{{jobTitle}}</strong> ({{jobNumber}})</p>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">Thank you for your interest. After careful consideration, we have decided to move forward with other candidates.</p>
<div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0 0 8px 0; font-size: 14px; color: #854d0e; font-weight: 500;">Don't be discouraged!</p>
  <p style="margin: 0; font-size: 13px; color: #854d0e;">The right opportunity is out there. Keep an eye on our careers page for future openings.</p>
</div>
<p style="margin: 0; font-size: 14px; color: #18181b;">We wish you all the best in your career journey.</p>`,
    },
    {
      type: 'INTERVIEW_INVITATION',
      name: 'Interview Invitation',
      subject: 'Interview Invitation - {{jobTitle}}',
      body: `<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">Interview Invitation</h1>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">Dear {{applicantName}},</p>
<p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">Position: <strong style="color: #18181b;">{{jobTitle}}</strong> ({{jobNumber}})</p>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">We would like to invite you to an interview.</p>
<div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #18181b;">Interview Details</h3>
  <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Date:</strong> {{interviewDate}}</p>
  <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Time:</strong> {{interviewTime}}</p>
  <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Format:</strong> {{interviewType}}</p>
  <p style="margin: 0; font-size: 14px;"><strong>Location:</strong> {{interviewLocation}}</p>
</div>
<p style="margin: 0; font-size: 14px; color: #18181b;">Please confirm your attendance by replying to this email.</p>`,
    },
    {
      type: 'JOB_OFFER',
      name: 'Job Offer',
      subject: 'Job Offer - {{jobTitle}}',
      body: `<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">Congratulations! 🎉</h1>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">Dear {{applicantName}},</p>
<p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">Position: <strong style="color: #18181b;">{{jobTitle}}</strong> ({{jobNumber}})</p>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">We are pleased to offer you the <strong>{{jobTitle}}</strong> position!</p>
<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="margin: 0 0 8px 0; font-size: 13px; color: #166534; font-weight: 500;">COMPENSATION PACKAGE</p>
  <p style="margin: 0; font-size: 24px; color: #15803d; font-weight: 600;">{{salaryDisplay}}</p>
  <p style="margin: 12px 0 0 0; font-size: 13px; color: #166534;"><strong>Start Date:</strong> {{startDate}}</p>
</div>
<p style="margin: 0; font-size: 14px; color: #18181b;">We look forward to welcoming you to our team!</p>`,
    },
    {
      type: 'APPLICATION_FOLLOW_UP',
      name: 'Application Follow-up',
      subject: 'Following Up - {{jobTitle}}',
      body: `<h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #18181b;">Application Status Update</h1>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b;">Dear {{applicantName}},</p>
<p style="margin: 0 0 24px 0; font-size: 13px; color: #71717a;">Position: <strong style="color: #18181b;">{{jobTitle}}</strong> ({{jobNumber}})</p>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">We wanted to follow up regarding your application for the {{jobTitle}} position.</p>
<p style="margin: 0 0 16px 0; font-size: 14px; color: #18181b; line-height: 1.6;">Your application is still under review. We appreciate your patience during our selection process.</p>
<p style="margin: 0; font-size: 14px; color: #18181b;">We will be in touch with an update as soon as possible.</p>`,
    },
  ];
}
