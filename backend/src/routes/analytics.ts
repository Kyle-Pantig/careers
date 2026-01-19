import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/auth';

export const analyticsRoutes = new Elysia({ prefix: '/analytics' })
  // Track page view - increments daily count
  .post('/page-view', async ({ body, set }) => {
    const { page } = body as { page: 'HOME' | 'JOBS' };
    
    // Get today's date (UTC, date only)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    try {
      // Upsert: increment count if exists, create with count=1 if not
      await prisma.$executeRaw`
        INSERT INTO daily_page_views (id, page, date, count)
        VALUES (gen_random_uuid(), ${page}::"PageType", ${today}::date, 1)
        ON CONFLICT (page, date)
        DO UPDATE SET count = daily_page_views.count + 1
      `;

      return { success: true };
    } catch (error) {
      console.error('Error tracking page view:', error);
      set.status = 500;
      return { error: 'Failed to track page view' };
    }
  }, {
    body: t.Object({
      page: t.Union([t.Literal('HOME'), t.Literal('JOBS')]),
    }),
  })

  // Get page view statistics (admin only)
  .get('/page-views', async ({ cookie, set }) => {
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

    // Get daily page views for the last 90 days
    const dailyPageViews = await prisma.$queryRaw`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '89 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      home_views AS (
        SELECT date, count
        FROM daily_page_views
        WHERE page = 'HOME'
          AND date >= CURRENT_DATE - INTERVAL '89 days'
      ),
      jobs_views AS (
        SELECT date, count
        FROM daily_page_views
        WHERE page = 'JOBS'
          AND date >= CURRENT_DATE - INTERVAL '89 days'
      )
      SELECT 
        ds.date::text as date,
        COALESCE(hv.count, 0)::int as home,
        COALESCE(jv.count, 0)::int as jobs
      FROM date_series ds
      LEFT JOIN home_views hv ON ds.date = hv.date
      LEFT JOIN jobs_views jv ON ds.date = jv.date
      ORDER BY ds.date ASC
    `;

    // Get totals for the last 90 days
    const totals = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(count) FILTER (WHERE page = 'HOME'), 0)::int as home_total,
        COALESCE(SUM(count) FILTER (WHERE page = 'JOBS'), 0)::int as jobs_total
      FROM daily_page_views
      WHERE date >= CURRENT_DATE - INTERVAL '89 days'
    ` as { home_total: number; jobs_total: number }[];

    return {
      dailyPageViews,
      totals: totals[0] || { home_total: 0, jobs_total: 0 },
    };
  });
