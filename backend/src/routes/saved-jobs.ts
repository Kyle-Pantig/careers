import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/auth';

export const savedJobRoutes = new Elysia({ prefix: '/saved-jobs' })
  // Get all saved jobs for current user
  .get('/', async ({ cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: payload.userId },
      include: {
        job: {
          include: {
            industry: true,
            _count: {
              select: { applications: true, views: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      savedJobs: savedJobs.map((sj) => ({
        id: sj.id,
        savedAt: sj.createdAt,
        job: sj.job,
      })),
    };
  })

  // Check if a job is saved
  .get('/check/:jobId', async ({ params, cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      // Not logged in - not saved
      return { isSaved: false };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      return { isSaved: false };
    }

    const savedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: payload.userId,
          jobId: params.jobId,
        },
      },
    });

    return { isSaved: !!savedJob };
  })

  // Save a job
  .post('/:jobId', async ({ params, cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized', requiresLogin: true };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token', requiresLogin: true };
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
    });

    if (!job) {
      set.status = 404;
      return { error: 'Job not found' };
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: payload.userId,
          jobId: params.jobId,
        },
      },
    });

    if (existing) {
      return { message: 'Job already saved', savedJob: existing };
    }

    // Save the job
    const savedJob = await prisma.savedJob.create({
      data: {
        userId: payload.userId,
        jobId: params.jobId,
      },
      include: {
        job: {
          include: {
            industry: true,
          },
        },
      },
    });

    return {
      message: 'Job saved successfully',
      savedJob: {
        id: savedJob.id,
        savedAt: savedJob.createdAt,
        job: savedJob.job,
      },
    };
  })

  // Unsave a job
  .delete('/:jobId', async ({ params, cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    // Check if saved
    const savedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: payload.userId,
          jobId: params.jobId,
        },
      },
    });

    if (!savedJob) {
      set.status = 404;
      return { error: 'Job not saved' };
    }

    // Delete the saved job
    await prisma.savedJob.delete({
      where: { id: savedJob.id },
    });

    return { message: 'Job removed from saved' };
  });
