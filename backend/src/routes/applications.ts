import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { uploadResume } from '../lib/storage';
import { authMiddleware } from '../middleware/auth';
import { PERMISSIONS } from '../../../shared/validators/permissions';
import { 
  sendApplicationConfirmationEmail, 
  sendCustomEmail, 
  sendTemplateEmail, 
  sendApplicationReviewedEmail,
  sendApplicationRejectionEmail,
  type EmailTemplateType 
} from '../lib/email';

export const applicationRoutes = new Elysia({ prefix: '/applications' })
  .use(authMiddleware)
  // Submit job application
  .post(
    '/',
    async ({ body, set }) => {
      const { jobNumber, firstName, lastName, email, contactNumber, address, resume, userId, customFieldValues } = body;

      const normalizedEmail = email.toLowerCase();

      // Find the job
      const job = await prisma.job.findUnique({
        where: { jobNumber },
      });

      if (!job) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      if (!job.isPublished) {
        set.status = 400;
        return { error: 'This job is not accepting applications' };
      }

      // Check if job has expired
      if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
        set.status = 400;
        return { error: 'This job posting has expired' };
      }

      // Check for existing application (by email or user)
      const existingApplication = await prisma.jobApplication.findFirst({
        where: {
          jobId: job.id,
          OR: [
            { email: normalizedEmail } as Record<string, unknown>,
            ...(userId ? [{ userId }] : []),
          ],
        },
      });

      // Upload resume
      let resumeUrl: string;
      try {
        resumeUrl = await uploadResume(resume, jobNumber, email);
      } catch (error) {
        set.status = 400;
        return { error: error instanceof Error ? error.message : 'Failed to upload resume' };
      }

      // Parse custom field values if provided
      // Accept either a JSON string (from FormData) or a plain object (if framework already parsed it)
      let parsedCustomFieldValues: Record<string, unknown> | undefined;
      if (customFieldValues) {
        const raw = customFieldValues as unknown;

        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              parsedCustomFieldValues = parsed as Record<string, unknown>;
            }
          } catch {
            // Ignore parse errors and proceed without custom field values
          }
        } else if (typeof raw === 'object') {
          parsedCustomFieldValues = raw as Record<string, unknown>;
        }
      }

      // If an application exists and is rejected, allow re-application by updating it
      let application: {
        id: string;
        status: string;
        createdAt: Date;
        job: { title: string; jobNumber: string; location: string };
      };

      if (existingApplication && existingApplication.status === 'rejected') {
        application = (await (prisma.jobApplication.update as Function)({
          where: { id: existingApplication.id },
          data: {
            userId: userId || existingApplication.userId || undefined,
            firstName,
            lastName,
            email: normalizedEmail,
            contactNumber,
            address,
            resumeUrl,
            resumeFileName: resume.name,
            // Always persist whatever we receive for customFieldValues
            customFieldValues:
              parsedCustomFieldValues !== undefined
                ? parsedCustomFieldValues
                : (customFieldValues as any),
            status: 'pending',
            notes: null,
            archivedAt: null,
          },
          include: {
            job: {
              select: {
                title: true,
                jobNumber: true,
                location: true,
              },
            },
          },
        })) as {
          id: string;
          status: string;
          createdAt: Date;
          job: { title: string; jobNumber: string; location: string };
        };
      } else {
        // If an application exists and is not rejected, block duplicate
        if (existingApplication) {
          set.status = 400;
          return { error: 'You have already applied for this position' };
        }

        // Create new application
        application = (await (prisma.jobApplication.create as Function)({
          data: {
            jobId: job.id,
            userId: userId || undefined,
            firstName,
            lastName,
            email: normalizedEmail,
            contactNumber,
            address,
            resumeUrl,
            resumeFileName: resume.name,
            // Always persist whatever we receive for customFieldValues
            customFieldValues:
              parsedCustomFieldValues !== undefined
                ? parsedCustomFieldValues
                : (customFieldValues as any),
            status: 'pending',
          },
          include: {
            job: {
              select: {
                title: true,
                jobNumber: true,
                location: true,
              },
            },
          },
        })) as {
          id: string;
          status: string;
          createdAt: Date;
          job: { title: string; jobNumber: string; location: string };
        };
      }

      // Send confirmation email (don't wait, don't fail if email fails)
      sendApplicationConfirmationEmail({
        applicantName: `${firstName} ${lastName}`,
        applicantEmail: email.toLowerCase(),
        jobTitle: application.job.title,
        jobNumber: application.job.jobNumber,
        companyLocation: application.job.location,
      }).catch((err) => {
        console.error('Failed to send application confirmation email:', err);
      });

      return {
        success: true,
        message: 'Application submitted successfully',
        application: {
          id: application.id,
          jobTitle: application.job.title,
          jobNumber: application.job.jobNumber,
          status: application.status,
          createdAt: application.createdAt,
        },
      };
    },
    {
      body: t.Object({
        jobNumber: t.String({ minLength: 1 }),
        firstName: t.String({ minLength: 1 }),
        lastName: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        contactNumber: t.String({ minLength: 1 }),
        address: t.String({ minLength: 1 }),
        resume: t.File(),
        userId: t.Optional(t.Nullable(t.String())),
        customFieldValues: t.Optional(t.Any()),
      }),
    }
  )

  // Get all applications (admin/staff) - excludes archived by default
  .get(
    '/all',
    async ({ query }) => {
      const { page = '1', limit = '50', status, search } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: Record<string, unknown> = {
        archivedAt: null, // Only non-archived applications
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { job: { title: { contains: search, mode: 'insensitive' } } },
          { job: { jobNumber: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobNumber: true,
                location: true,
                salaryMin: true,
                salaryMax: true,
                salaryPeriod: true,
                salaryCurrency: true,
                industry: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        prisma.jobApplication.count({ where }),
      ]);

      return {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_VIEW,
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    }
  )

  // Get archived applications (admin/staff)
  .get(
    '/archived',
    async ({ query }) => {
      const { page = '1', limit = '50', status, search } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: Record<string, unknown> = {
        archivedAt: { not: null }, // Only archived applications
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { job: { title: { contains: search, mode: 'insensitive' } } },
          { job: { jobNumber: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { archivedAt: 'desc' } as Record<string, unknown>,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobNumber: true,
                location: true,
                salaryMin: true,
                salaryMax: true,
                salaryPeriod: true,
                salaryCurrency: true,
                industry: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        prisma.jobApplication.count({ where }),
      ]);

      return {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_VIEW,
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    }
  )

  // Get applications for a job (admin/staff)
  .get(
    '/job/:jobId',
    async ({ params, query }) => {
      const { page = '1', limit = '10', status } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: Record<string, unknown> = {
        jobId: params.jobId,
      };

      if (status) {
        where.status = status;
      }

      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            job: {
              select: {
                title: true,
                jobNumber: true,
              },
            },
          },
        }),
        prisma.jobApplication.count({ where }),
      ]);

      return {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_VIEW,
      params: t.Object({
        jobId: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // Get user's applications
  .get(
    '/user/:userId',
    async ({ params, query }) => {
      const { page = '1', limit = '10' } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [applications, total] = await Promise.all([
prisma.jobApplication.findMany({
          where: { userId: params.userId },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobNumber: true,
                location: true,
                workType: true,
                jobType: true,
                industry: {
                  select: {
                    name: true,
                  },
                },
              } as Record<string, unknown>,
            },
          },
        }),
        prisma.jobApplication.count({ where: { userId: params.userId } }),
      ]);

      return {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )

  // Get single application for admin/staff
  .get(
    '/admin/:id',
    async ({ params, set }) => {
      const application = await prisma.jobApplication.findUnique({
        where: { id: params.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              jobNumber: true,
              location: true,
              workType: true,
              jobType: true,
              salaryMin: true,
              salaryMax: true,
              salaryPeriod: true,
              salaryCurrency: true,
              customApplicationFields: true,
              industry: {
                select: {
                  name: true,
                },
              },
            } as Record<string, unknown>,
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!application) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      return { application };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_VIEW,
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Get single application (users can view their own)
  .get(
    '/:id',
    async ({ params, set, user }) => {
      const application = await prisma.jobApplication.findUnique({
        where: { id: params.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              jobNumber: true,
              location: true,
              workType: true,
              jobType: true,
              salaryMin: true,
              salaryMax: true,
              salaryPeriod: true,
              salaryCurrency: true,
              customApplicationFields: true,
              industry: {
                select: {
                  name: true,
                },
              },
            } as Record<string, unknown>,
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!application) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      // Check if user is the owner of the application
      // Allow access if: userId matches OR email matches (for guest applications)
      const appData = application as typeof application & { email: string; userId: string | null };
      const userData = user as { userId?: string; email?: string } | null;
      const isOwner = userData && (
        appData.userId === userData.userId || 
        appData.email === userData.email
      );
      
      if (!isOwner) {
        set.status = 403;
        return { error: 'You do not have permission to view this application' };
      }

      return { application };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Update application status (admin/staff)
  .patch(
    '/:id/status',
    async ({ params, body, set }) => {
      const existingApplication = await prisma.jobApplication.findUnique({
        where: { id: params.id },
      });

      if (!existingApplication) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      const application = await (prisma.jobApplication.update as Function)({
        where: { id: params.id },
        data: {
          status: body.status,
          notes: body.notes,
        },
        include: {
          job: {
            select: {
              title: true,
              jobNumber: true,
            },
          },
        },
      }) as { 
        id: string; 
        email: string; 
        firstName: string; 
        lastName: string; 
        status: string;
        job: { title: string; jobNumber: string } 
      };

      // Send automatic status update emails
      const emailData = {
        applicantName: `${application.firstName} ${application.lastName}`,
        applicantEmail: application.email,
        jobTitle: application.job.title,
        jobNumber: application.job.jobNumber,
      };

      // Send email based on status change (don't wait, don't fail if email fails)
      if (body.status === 'reviewed') {
        sendApplicationReviewedEmail(emailData).catch((err) => {
          console.error('Failed to send reviewed email:', err);
        });
      } else if (body.status === 'rejected') {
        sendApplicationRejectionEmail(emailData).catch((err) => {
          console.error('Failed to send rejection email:', err);
        });
      }

      return {
        application,
        message: 'Application status updated successfully',
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_EDIT,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal('pending'),
          t.Literal('reviewed'),
          t.Literal('shortlisted'),
          t.Literal('rejected'),
          t.Literal('hired'),
        ]),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // Archive an application (admin/staff)
  .patch(
    '/:id/archive',
    async ({ params, set }) => {
      const existingApplication = await prisma.jobApplication.findUnique({
        where: { id: params.id },
      });

      if (!existingApplication) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      const application = await (prisma.jobApplication.update as Function)({
        where: { id: params.id },
        data: {
          archivedAt: new Date(),
        },
        include: {
          job: {
            select: {
              title: true,
              jobNumber: true,
            },
          },
        },
      });

      return {
        application,
        message: 'Application archived successfully',
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_EDIT,
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Restore an archived application (admin/staff)
  .patch(
    '/:id/restore',
    async ({ params, set }) => {
      const existingApplication = await prisma.jobApplication.findUnique({
        where: { id: params.id },
      });

      if (!existingApplication) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      const application = await (prisma.jobApplication.update as Function)({
        where: { id: params.id },
        data: {
          archivedAt: null,
        },
        include: {
          job: {
            select: {
              title: true,
              jobNumber: true,
            },
          },
        },
      });

      return {
        application,
        message: 'Application restored successfully',
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_EDIT,
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Permanently delete an application (admin/staff)
  .delete(
    '/:id',
    async ({ params, set }) => {
      const existingApplication = await prisma.jobApplication.findUnique({
        where: { id: params.id },
      });

      if (!existingApplication) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      await prisma.jobApplication.delete({
        where: { id: params.id },
      });

      return {
        success: true,
        message: 'Application permanently deleted',
      };
    },
    {
      hasPermission: PERMISSIONS.APPLICATIONS_EDIT,
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Check if user has applied for a job
  .get(
    '/check/:jobNumber',
    async ({ params, query }) => {
      const { email, userId } = query;

      const job = await prisma.job.findUnique({
        where: { jobNumber: params.jobNumber },
      });

      if (!job) {
        return { hasApplied: false };
      }

      const application = await prisma.jobApplication.findFirst({
        where: {
          jobId: job.id,
          OR: [
            ...(email ? [{ email: email.toLowerCase() } as Record<string, unknown>] : []),
            ...(userId ? [{ userId }] : []),
          ],
          // Only treat as "applied" if not rejected
          status: {
            not: 'rejected',
          },
        },
      });

      return {
        hasApplied: !!application,
        application: application
          ? {
              id: application.id,
              status: application.status,
              createdAt: application.createdAt,
            }
          : null,
      };
    },
    {
      params: t.Object({
        jobNumber: t.String(),
      }),
      query: t.Object({
        email: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
    }
  )

  // Send custom email to applicant
  .post(
    '/:id/email',
    async ({ params, body, set }) => {
      const application = await prisma.jobApplication.findUnique({
        where: { id: params.id },
        include: {
          job: {
            select: {
              title: true,
              jobNumber: true,
            },
          },
        },
      }) as { id: string; email: string; firstName: string; lastName: string; job: { title: string; jobNumber: string } } | null;

      if (!application) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      try {
        await sendCustomEmail({
          toEmail: application.email,
          toName: `${application.firstName} ${application.lastName}`,
          subject: body.subject,
          message: body.message,
          jobTitle: application.job.title,
          jobNumber: application.job.jobNumber,
        });

        return {
          success: true,
          message: 'Email sent successfully',
        };
      } catch (error) {
        console.error('Failed to send email:', error);
        set.status = 500;
        return { error: 'Failed to send email' };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        subject: t.String({ minLength: 1 }),
        message: t.String({ minLength: 1 }),
      }),
    }
  )

  // Send template email to applicant
  .post(
    '/:id/email/template',
    async ({ params, body, set }) => {
      const application = await prisma.jobApplication.findUnique({
        where: { id: params.id },
        include: {
          job: {
            select: {
              title: true,
              jobNumber: true,
            },
          },
        },
      }) as { id: string; email: string; firstName: string; lastName: string; status: string; job: { title: string; jobNumber: string } } | null;

      if (!application) {
        set.status = 404;
        return { error: 'Application not found' };
      }

      try {
        await sendTemplateEmail({
          toEmail: application.email,
          toName: `${application.firstName} ${application.lastName}`,
          jobTitle: application.job.title,
          jobNumber: application.job.jobNumber,
          templateType: body.templateType as EmailTemplateType,
          customData: body.customData,
        });

        // Auto-update application status based on template type
        // Note: 'offer' does NOT auto-update to 'hired' since candidate may decline
        const statusMap: Record<string, string> = {
          'rejection': 'rejected',
          'interview_invitation': 'shortlisted',
        };

        const newStatus = statusMap[body.templateType];
        if (newStatus && application.status !== newStatus) {
          await (prisma.jobApplication.update as Function)({
            where: { id: params.id },
            data: { status: newStatus },
          });
        }

        return {
          success: true,
          message: 'Email sent successfully',
          statusUpdated: newStatus ? newStatus : undefined,
        };
      } catch (error) {
        console.error('Failed to send email:', error);
        set.status = 500;
        return { error: 'Failed to send email' };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        templateType: t.Union([
          t.Literal('interview_invitation'),
          t.Literal('rejection'),
          t.Literal('offer'),
          t.Literal('follow_up'),
        ]),
        customData: t.Optional(
          t.Object({
            interviewDate: t.Optional(t.String()),
            interviewTime: t.Optional(t.String()),
            interviewLocation: t.Optional(t.String()),
            interviewType: t.Optional(t.String()),
            additionalNotes: t.Optional(t.String()),
            // Offer template fields
            salaryAmount: t.Optional(t.String()),
            salaryCurrency: t.Optional(t.String()),
            salaryPeriod: t.Optional(t.String()),
            startDate: t.Optional(t.String()),
          })
        ),
      }),
    }
  );
