import { Elysia } from 'elysia';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/auth';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  // Get dashboard statistics
  .get('/stats', async ({ cookie, set }) => {
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

    // Get all statistics in parallel
    const [
      totalJobs,
      publishedJobs,
      draftJobs,
      expiredJobs,
      totalApplications,
      pendingApplications,
      reviewedApplications,
      shortlistedApplications,
      rejectedApplications,
      hiredApplications,
      totalUsers,
      totalIndustries,
      activeIndustries,
      recentApplications,
      recentJobs,
      applicationsByMonth,
      jobsByIndustry,
      applicationsByIndustry,
      totalJobViews,
      dailyActivity,
    ] = await Promise.all([
      // Jobs stats
      prisma.job.count(),
      prisma.job.count({ where: { isPublished: true } }),
      prisma.job.count({ where: { isPublished: false } }),
      prisma.job.count({ where: { expiresAt: { lt: new Date() } } }),
      
      // Applications stats
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { status: 'pending' } }),
      prisma.jobApplication.count({ where: { status: 'reviewed' } }),
      prisma.jobApplication.count({ where: { status: 'shortlisted' } }),
      prisma.jobApplication.count({ where: { status: 'rejected' } }),
      prisma.jobApplication.count({ where: { status: 'hired' } }),
      
      // Users stats
      prisma.user.count(),
      
      // Industries stats
      prisma.industry.count(),
      prisma.industry.count({ where: { isActive: true } }),
      
      // Recent applications (last 5)
      prisma.jobApplication.findMany({
        take: 5,
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
      
      // Recent jobs (last 5)
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          industry: {
            select: { name: true },
          },
          _count: {
            select: { applications: true, views: true },
          },
        },
      }),
      
      // Applications by month (last 6 months)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          EXTRACT(MONTH FROM "createdAt") as month_num,
          EXTRACT(YEAR FROM "createdAt") as year,
          COUNT(*)::int as count
        FROM job_applications
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt"), EXTRACT(MONTH FROM "createdAt"), EXTRACT(YEAR FROM "createdAt")
        ORDER BY year DESC, month_num DESC
        LIMIT 6
      `,
      
      // Jobs by industry
      prisma.industry.findMany({
        where: { isActive: true },
        select: {
          name: true,
          _count: {
            select: { jobs: true },
          },
        },
        orderBy: {
          jobs: { _count: 'desc' },
        },
        take: 6,
      }),
      
      // Applications by industry
      prisma.$queryRaw`
        SELECT 
          i.name as industry,
          COUNT(ja.id)::int as count
        FROM industries i
        LEFT JOIN jobs j ON j."industryId" = i.id
        LEFT JOIN job_applications ja ON ja."jobId" = j.id
        WHERE i."isActive" = true
        GROUP BY i.id, i.name
        ORDER BY count DESC
        LIMIT 6
      `,
      
      // Total job views
      prisma.jobView.count(),
      
      // Daily activity (views and applications) for last 90 days
      prisma.$queryRaw`
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '89 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date as date
        ),
        daily_views AS (
          SELECT 
            DATE("createdAt") as date,
            COUNT(*)::int as views
          FROM job_views
          WHERE "createdAt" >= CURRENT_DATE - INTERVAL '89 days'
          GROUP BY DATE("createdAt")
        ),
        daily_applications AS (
          SELECT 
            DATE("createdAt") as date,
            COUNT(*)::int as applications
          FROM job_applications
          WHERE "createdAt" >= CURRENT_DATE - INTERVAL '89 days'
          GROUP BY DATE("createdAt")
        )
        SELECT 
          ds.date::text as date,
          COALESCE(dv.views, 0)::int as views,
          COALESCE(da.applications, 0)::int as applications
        FROM date_series ds
        LEFT JOIN daily_views dv ON ds.date = dv.date
        LEFT JOIN daily_applications da ON ds.date = da.date
        ORDER BY ds.date ASC
      `,
    ]);

    // Get users by role
    const usersByRole = await prisma.$queryRaw`
      SELECT 
        r.name as role,
        COUNT(DISTINCT ur."userId")::int as count
      FROM roles r
      LEFT JOIN user_roles ur ON ur."roleId" = r.id
      GROUP BY r.id, r.name
      ORDER BY count DESC
    `;

    return {
      overview: {
        jobs: {
          total: totalJobs,
          published: publishedJobs,
          draft: draftJobs,
          expired: expiredJobs,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          reviewed: reviewedApplications,
          shortlisted: shortlistedApplications,
          rejected: rejectedApplications,
          hired: hiredApplications,
        },
        users: {
          total: totalUsers,
          byRole: usersByRole,
        },
        industries: {
          total: totalIndustries,
          active: activeIndustries,
        },
        views: totalJobViews,
      },
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        applicantName: `${app.firstName} ${app.lastName}`,
        email: app.email,
        status: app.status,
        jobTitle: app.job.title,
        jobNumber: app.job.jobNumber,
        createdAt: app.createdAt,
      })),
      recentJobs: recentJobs.map((job) => ({
        id: job.id,
        title: job.title,
        jobNumber: job.jobNumber,
        industry: job.industry.name,
        location: job.location,
        isPublished: job.isPublished,
        applicationsCount: job._count.applications,
        viewsCount: job._count.views,
        createdAt: job.createdAt,
      })),
      charts: {
        applicationsByMonth: (applicationsByMonth as any[]).reverse(),
        jobsByIndustry: (jobsByIndustry as any[]).map((i) => ({
          name: i.name,
          count: i._count.jobs,
        })),
        applicationsByIndustry: applicationsByIndustry,
        dailyActivity: dailyActivity,
      },
    };
  });
