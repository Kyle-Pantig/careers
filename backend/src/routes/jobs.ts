import { Elysia, t } from 'elysia';
import { createHash } from 'crypto';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { verifyToken } from '../lib/auth';
import { PERMISSIONS } from '../../../shared/validators/permissions';

// Hash IP address for privacy
function hashIpAddress(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

// Generate next job number (JN-XXXX format)
async function generateJobNumber(): Promise<string> {
  const lastJob = await prisma.job.findFirst({
    orderBy: { jobNumber: 'desc' },
    select: { jobNumber: true },
  });

  if (!lastJob || !lastJob.jobNumber) {
    return 'JN-0001';
  }

  // Extract the number from JN-XXXX format
  const match = lastJob.jobNumber.match(/JN-(\d+)/);
  if (!match) {
    return 'JN-0001';
  }

  const nextNumber = parseInt(match[1], 10) + 1;
  return `JN-${nextNumber.toString().padStart(4, '0')}`;
}

export const jobRoutes = new Elysia({ prefix: '/jobs' })
  // =========================================================
  // PUBLIC ROUTES
  // =========================================================

  // Get all published jobs (public) - includes expired jobs so they can show "Expired" button
  .get(
    '/',
    async ({ query }) => {
      const { page = '1', limit = '10', search, workType, industryId, location } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: Record<string, unknown> = {
        isPublished: true,
      };

      if (search) {
        where.AND = [
          {
            OR: [
              { jobNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
              { industry: { name: { contains: search, mode: 'insensitive' } } },
            ],
          },
        ];
      }

      if (workType) {
        where.workType = workType;
      }

      if (industryId) {
        where.industryId = industryId;
      }

      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { publishedAt: 'desc' },
          include: {
            industry: true,
            _count: {
              select: { views: true },
            },
          },
        }),
        prisma.job.count({ where }),
      ]);

      return {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
        workType: t.Optional(t.String()),
        industryId: t.Optional(t.String()),
        location: t.Optional(t.String()),
      }),
    }
  )

  // Get single job by ID (public)
  .get(
    '/:id',
    async ({ params, set }) => {
      const job = await prisma.job.findUnique({
        where: { id: params.id },
        include: {
          industry: true,
          _count: {
            select: { applications: true, views: true },
          },
        },
      });

      if (!job) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      return { job };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Get single job by job number (public view - only published jobs)
  .get(
    '/number/:jobNumber',
    async ({ params, set }) => {
      const job = await prisma.job.findUnique({
        where: { jobNumber: params.jobNumber },
        include: {
          industry: true,
          _count: {
            select: { applications: true, views: true },
          },
        },
      });

      if (!job) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      // Only return published jobs on public page
      if (!job.isPublished) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      return { job };
    },
    {
      params: t.Object({
        jobNumber: t.String(),
      }),
    }
  )

  // Track job view (public)
  .post(
    '/:jobNumber/view',
    async ({ params, body, request, set }) => {
      // Find the job
      const job = await prisma.job.findUnique({
        where: { jobNumber: params.jobNumber },
      });

      if (!job) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      const userId = body.userId || null;

      // Get IP address from request headers (common proxy headers)
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const cfConnectingIp = request.headers.get('cf-connecting-ip');
      const rawIp = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';

      // Hash IP for privacy
      const hashedIp = hashIpAddress(rawIp);

      // Get user agent
      const userAgent = request.headers.get('user-agent') || null;

      try {
        // For authenticated users, check by userId
        if (userId) {
          const existingView = await prisma.jobView.findUnique({
            where: {
              jobId_userId: {
                jobId: job.id,
                userId: userId,
              },
            },
          });

          if (existingView) {
            return { success: true, message: 'View already counted', newView: false };
          }

          await prisma.jobView.create({
            data: {
              jobId: job.id,
              userId: userId,
              userAgent,
            },
          });

          return { success: true, message: 'View recorded', newView: true };
        }

        // For guest users, check by IP address
        const existingView = await prisma.jobView.findUnique({
          where: {
            jobId_ipAddress: {
              jobId: job.id,
              ipAddress: hashedIp,
            },
          },
        });

        if (existingView) {
          return { success: true, message: 'View already counted', newView: false };
        }

        await prisma.jobView.create({
          data: {
            jobId: job.id,
            ipAddress: hashedIp,
            userAgent,
          },
        });

        return { success: true, message: 'View recorded', newView: true };
      } catch (error) {
        // Handle unique constraint violation (race condition)
        return { success: true, message: 'View already counted', newView: false };
      }
    },
    {
      params: t.Object({
        jobNumber: t.String(),
      }),
      body: t.Object({
        userId: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // =========================================================
  // PROTECTED ROUTES
  // =========================================================
  .use(authMiddleware)

  // Get all jobs (admin/staff - includes unpublished)
  .get(
    '/admin',
    async ({ query }) => {
      const { page = '1', limit = '10', search, workType, isPublished, industryId } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { jobNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { industry: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (workType) {
        where.workType = workType;
      }

      if (isPublished !== undefined) {
        where.isPublished = isPublished === 'true';
      }

      if (industryId) {
        where.industryId = industryId;
      }

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            industry: true,
            _count: {
              select: { applications: true, views: true },
            },
          },
        }),
        prisma.job.count({ where }),
      ]);

      return {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    },
    {
      hasPermission: PERMISSIONS.JOBS_VIEW,
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
        workType: t.Optional(t.String()),
        isPublished: t.Optional(t.String()),
        industryId: t.Optional(t.String()),
      }),
    }
  )

  // Get single job by job number (admin preview - includes unpublished)
  // Note: We need this under authMiddleware section to ensure admin check works
  .get(
    '/admin/number/:jobNumber',
    async ({ params, cookie, set }) => {
      // Verify admin/staff
      const token = cookie.token?.value as string | undefined;
      if (!token) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const payload = verifyToken(token);
      if (!payload) {
        set.status = 401;
        return { error: 'Invalid token' };
      }

      // Check if user is admin or staff
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        set.status = 404;
        return { error: 'User not found' };
      }

      const roles = user.roles.map((ur) => ur.role.name);
      if (!roles.includes('admin') && !roles.includes('staff')) {
        set.status = 403;
        return { error: 'Access denied' };
      }

      const job = await prisma.job.findUnique({
        where: { jobNumber: params.jobNumber },
        include: {
          industry: true,
          _count: {
            select: { applications: true, views: true },
          },
        },
      });

      if (!job) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      return { job };
    },
    {
      params: t.Object({
        jobNumber: t.String(),
      }),
    }
  )

  // Create job (admin/staff only)
  .post(
    '/',
    async ({ body, set }) => {
      // Verify industry exists
      const industry = await prisma.industry.findUnique({
        where: { id: body.industryId },
      });

      if (!industry) {
        set.status = 400;
        return { error: 'Invalid industry selected' };
      }

      // Generate job number
      const jobNumber = await generateJobNumber();

      const createData = {
        jobNumber,
        title: body.title,
        description: body.description,
        industryId: body.industryId,
        location: body.location,
        workType: body.workType,
        jobType: body.jobType || 'FULL_TIME',
        shiftType: body.shiftType || 'DAY',
        experienceMin: body.experienceMin || 0,
        experienceMax: body.experienceMax ?? null,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        salaryCurrency: body.salaryCurrency || 'USD',
        salaryPeriod: body.salaryPeriod || 'YEARLY',
        isPublished: body.isPublished || false,
        publishedAt: body.isPublished ? new Date() : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        customApplicationFields: body.customApplicationFields ?? null,
      };

      const job = await prisma.job.create({
        data: createData,
        include: {
          industry: true,
        },
      });

      return { job, message: 'Job created successfully' };
    },
    {
      hasPermission: PERMISSIONS.JOBS_CREATE,
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        industryId: t.String({ minLength: 1 }),
        location: t.String({ minLength: 1 }),
        workType: t.Union([
          t.Literal('ONSITE'),
          t.Literal('REMOTE'),
          t.Literal('HYBRID'),
        ]),
        jobType: t.Optional(t.Union([
          t.Literal('FULL_TIME'),
          t.Literal('PART_TIME'),
          t.Literal('CONTRACT'),
          t.Literal('FREELANCE'),
          t.Literal('INTERNSHIP'),
          t.Literal('TEMPORARY'),
        ])),
        shiftType: t.Optional(t.Union([
          t.Literal('DAY'),
          t.Literal('NIGHT'),
          t.Literal('ROTATING'),
          t.Literal('FLEXIBLE'),
        ])),
        experienceMin: t.Optional(t.Number()),
        experienceMax: t.Optional(t.Nullable(t.Number())),
        salaryMin: t.Optional(t.Nullable(t.Number())),
        salaryMax: t.Optional(t.Nullable(t.Number())),
        salaryCurrency: t.Optional(t.Union([
          t.Literal('USD'),
          t.Literal('EUR'),
          t.Literal('GBP'),
          t.Literal('PHP'),
          t.Literal('JPY'),
          t.Literal('AUD'),
          t.Literal('CAD'),
          t.Literal('SGD'),
          t.Literal('INR'),
          t.Literal('CNY'),
        ])),
        salaryPeriod: t.Optional(t.Union([
          t.Literal('HOURLY'),
          t.Literal('MONTHLY'),
          t.Literal('YEARLY'),
        ])),
        isPublished: t.Optional(t.Boolean()),
        expiresAt: t.Optional(t.String()),
        customApplicationFields: t.Optional(
          t.Array(
            t.Object({
              key: t.String(),
              label: t.String(),
              type: t.Union([
                t.Literal('text'),
                t.Literal('textarea'),
                t.Literal('number'),
                t.Literal('select'),
              ]),
              required: t.Boolean(),
              options: t.Optional(t.Array(t.String())),
            })
          )
        ),
      }),
    }
  )

  // Update job (admin/staff only)
  .put(
    '/:id',
    async ({ params, body, set }) => {
      const existingJob = await prisma.job.findUnique({
        where: { id: params.id },
      });

      if (!existingJob) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      // Verify industry exists
      const industry = await prisma.industry.findUnique({
        where: { id: body.industryId },
      });

      if (!industry) {
        set.status = 400;
        return { error: 'Invalid industry selected' };
      }

      // Handle publishing logic
      let publishedAt = existingJob.publishedAt;
      if (body.isPublished && !existingJob.isPublished) {
        publishedAt = new Date();
      } else if (!body.isPublished) {
        publishedAt = null;
      }

      const updateData = {
        title: body.title,
        description: body.description,
        industryId: body.industryId,
        location: body.location,
        workType: body.workType,
        jobType: body.jobType,
        shiftType: body.shiftType,
        experienceMin: body.experienceMin,
        experienceMax: body.experienceMax ?? null,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        salaryCurrency: body.salaryCurrency,
        salaryPeriod: body.salaryPeriod,
        isPublished: body.isPublished,
        publishedAt,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        customApplicationFields: body.customApplicationFields ?? null,
      };

      const job = await prisma.job.update({
        where: { id: params.id },
        data: updateData,
        include: {
          industry: true,
        },
      });

      return { job, message: 'Job updated successfully' };
    },
    {
      hasPermission: PERMISSIONS.JOBS_EDIT,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        industryId: t.String({ minLength: 1 }),
        location: t.String({ minLength: 1 }),
        workType: t.Union([
          t.Literal('ONSITE'),
          t.Literal('REMOTE'),
          t.Literal('HYBRID'),
        ]),
        jobType: t.Optional(t.Union([
          t.Literal('FULL_TIME'),
          t.Literal('PART_TIME'),
          t.Literal('CONTRACT'),
          t.Literal('FREELANCE'),
          t.Literal('INTERNSHIP'),
          t.Literal('TEMPORARY'),
        ])),
        shiftType: t.Optional(t.Union([
          t.Literal('DAY'),
          t.Literal('NIGHT'),
          t.Literal('ROTATING'),
          t.Literal('FLEXIBLE'),
        ])),
        experienceMin: t.Optional(t.Number()),
        experienceMax: t.Optional(t.Nullable(t.Number())),
        salaryMin: t.Optional(t.Nullable(t.Number())),
        salaryMax: t.Optional(t.Nullable(t.Number())),
        salaryCurrency: t.Optional(t.Union([
          t.Literal('USD'),
          t.Literal('EUR'),
          t.Literal('GBP'),
          t.Literal('PHP'),
          t.Literal('JPY'),
          t.Literal('AUD'),
          t.Literal('CAD'),
          t.Literal('SGD'),
          t.Literal('INR'),
          t.Literal('CNY'),
        ])),
        salaryPeriod: t.Optional(t.Union([
          t.Literal('HOURLY'),
          t.Literal('MONTHLY'),
          t.Literal('YEARLY'),
        ])),
        isPublished: t.Optional(t.Boolean()),
        expiresAt: t.Optional(t.String()),
        customApplicationFields: t.Optional(
          t.Array(
            t.Object({
              key: t.String(),
              label: t.String(),
              type: t.Union([
                t.Literal('text'),
                t.Literal('textarea'),
                t.Literal('number'),
                t.Literal('select'),
              ]),
              required: t.Boolean(),
              options: t.Optional(t.Array(t.String())),
            })
          )
        ),
      }),
    }
  )

  // Delete job (admin/staff only)
  .delete(
    '/:id',
    async ({ params, set }) => {
      const existingJob = await prisma.job.findUnique({
        where: { id: params.id },
      });

      if (!existingJob) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      await prisma.job.delete({
        where: { id: params.id },
      });

      return { message: 'Job deleted successfully' };
    },
    {
      hasPermission: PERMISSIONS.JOBS_DELETE,
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Toggle publish status
  .patch(
    '/:id/publish',
    async ({ params, set }) => {
      const existingJob = await prisma.job.findUnique({
        where: { id: params.id },
      });

      if (!existingJob) {
        set.status = 404;
        return { error: 'Job not found' };
      }

      const isPublished = !existingJob.isPublished;
      const job = await prisma.job.update({
        where: { id: params.id },
        data: {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        },
        include: {
          industry: true,
        },
      });

      return { job, message: isPublished ? 'Job published successfully' : 'Job unpublished successfully' };
    },
    {
      hasPermission: PERMISSIONS.JOBS_PUBLISH,
      params: t.Object({
        id: t.String(),
      }),
    }
  );
