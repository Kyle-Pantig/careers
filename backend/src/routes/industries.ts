import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

export const industryRoutes = new Elysia({ prefix: '/industries' })
  .use(authMiddleware)
  // =========================================================
  // PUBLIC ROUTES (Secured by API Secret)
  // =========================================================

  // Get all industries (public - only active)
  .get(
    '/',
    async () => {
      const industries = await prisma.industry.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { jobs: true },
          },
        },
      });

      return { industries };
    },
    {
      verifyApiSecret: true,
    }
  )

  // Get single industry
  .get(
    '/:id',
    async ({ params, set }) => {
      const industry = await prisma.industry.findUnique({
        where: { id: params.id },
        include: {
          _count: {
            select: { jobs: true },
          },
        },
      });

      if (!industry) {
        set.status = 404;
        return { error: 'Industry not found' };
      }

      return { industry };
    },
    {
      verifyApiSecret: true,
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // =========================================================
  // PROTECTED ROUTES
  // =========================================================
  // .use(authMiddleware) moved to top

  // Get all industries (admin - includes inactive)
  .get(
    '/admin',
    async () => {
      const industries = await prisma.industry.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { jobs: true },
          },
        },
      });

      return { industries };
    }
  )

  // Create industry
  .post(
    '/',
    async ({ body, set }) => {
      // Check if industry with same name exists
      const existing = await prisma.industry.findUnique({
        where: { name: body.name },
      });

      if (existing) {
        set.status = 400;
        return { error: 'An industry with this name already exists' };
      }

      const industry = await prisma.industry.create({
        data: {
          name: body.name,
          description: body.description || null,
          isActive: body.isActive ?? true,
        },
      });

      return { industry, message: 'Industry created successfully' };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update industry
  .put(
    '/:id',
    async ({ params, body, set }) => {
      const existing = await prisma.industry.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { error: 'Industry not found' };
      }

      // Check if name is taken by another industry
      if (body.name !== existing.name) {
        const nameExists = await prisma.industry.findUnique({
          where: { name: body.name },
        });

        if (nameExists) {
          set.status = 400;
          return { error: 'An industry with this name already exists' };
        }
      }

      const industry = await prisma.industry.update({
        where: { id: params.id },
        data: {
          name: body.name,
          description: body.description || null,
          isActive: body.isActive,
        },
      });

      return { industry, message: 'Industry updated successfully' };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete industry
  .delete(
    '/:id',
    async ({ params, set }) => {
      const existing = await prisma.industry.findUnique({
        where: { id: params.id },
        include: {
          _count: {
            select: { jobs: true },
          },
        },
      });

      if (!existing) {
        set.status = 404;
        return { error: 'Industry not found' };
      }

      // Prevent deletion if there are jobs using this industry
      if (existing._count.jobs > 0) {
        set.status = 400;
        return {
          error: `Cannot delete industry with ${existing._count.jobs} associated jobs. Please reassign or delete those jobs first.`
        };
      }

      await prisma.industry.delete({
        where: { id: params.id },
      });

      return { message: 'Industry deleted successfully' };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Toggle active status
  .patch(
    '/:id/toggle',
    async ({ params, set }) => {
      const existing = await prisma.industry.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { error: 'Industry not found' };
      }

      const industry = await prisma.industry.update({
        where: { id: params.id },
        data: {
          isActive: !existing.isActive,
        },
      });

      return {
        industry,
        message: industry.isActive ? 'Industry activated' : 'Industry deactivated'
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
