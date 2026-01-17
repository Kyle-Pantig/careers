import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import {
  STAFF_PERMISSION_LEVELS,
  PERMISSION_LEVEL_INFO,
  DEFAULT_ROLE_PERMISSION_LEVEL,
  getAllPermissionLevels,
} from '../../../shared/validators/permissions';
import { authMiddleware } from '../middleware/auth';

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(authMiddleware)

  // Get all users (admin/staff with read access)
  .get(
    '/admin',
    async ({ query }) => {
      const { page = '1', limit = '10', search, role } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.roles = {
          some: {
            role: {
              name: role,
            },
          },
        };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailVerified: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            roles: {
              select: {
                id: true,
                permissionLevel: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
            _count: {
              select: {
                applications: true,
                savedJobs: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
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
        role: t.Optional(t.String()),
      }),
    }
  )

  // Get single user by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          contactNumber: true,
          address: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              id: true,
              permissionLevel: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: true,
              savedJobs: true,
            },
          },
        },
      });

      if (!user) {
        set.status = 404;
        return { error: 'User not found' };
      }

      return { user };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Get all roles (for dropdown) - only admin can see this for management
  .get('/roles/all', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    return { roles };
  })

  // Update user role - ADMIN ONLY
  .patch(
    '/:id/role',
    async ({ params, body, set, user: currentUser }) => {
      if (!currentUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      // Only admin can change roles
      const isCurrentUserAdmin = currentUser.roles.includes('admin');
      if (!isCurrentUserAdmin) {
        set.status = 403;
        return { error: 'Only administrators can change user roles' };
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!targetUser) {
        set.status = 404;
        return { error: 'User not found' };
      }

      // Get the new role being assigned
      const newRole = await prisma.role.findUnique({
        where: { id: body.roleId },
      });

      if (!newRole) {
        set.status = 400;
        return { error: 'Invalid role' };
      }

      const isTargetUserAdmin = targetUser.roles.some((ur) => ur.role.name === 'admin');
      const isSelf = currentUser.userId === params.id;

      // Admin cannot change their own role
      if (isSelf) {
        set.status = 403;
        return { error: 'You cannot change your own role' };
      }

      // Cannot modify the primary admin user's role
      if (isTargetUserAdmin && targetUser.email === process.env.ADMIN_EMAIL) {
        set.status = 403;
        return { error: 'Cannot modify the primary admin user role' };
      }

      // Get default permission level for the role
      const defaultPermissionLevel = DEFAULT_ROLE_PERMISSION_LEVEL[newRole.name] || null;

      // Remove existing roles and add new one
      await prisma.$transaction([
        prisma.userRole.deleteMany({
          where: { userId: params.id },
        }),
        prisma.userRole.create({
          data: {
            userId: params.id,
            roleId: body.roleId,
            permissionLevel: body.permissionLevel || defaultPermissionLevel,
          },
        }),
      ]);

      const updatedUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roles: {
            select: {
              id: true,
              permissionLevel: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return { user: updatedUser, message: 'User role updated successfully' };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        roleId: t.String(),
        permissionLevel: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )

  // Toggle user active status (deactivate/activate) - ADMIN ONLY
  .patch(
    '/:id/toggle-active',
    async ({ params, set, user: currentUser }) => {
      if (!currentUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      // Only admin can deactivate/activate users
      const isCurrentUserAdmin = currentUser.roles.includes('admin');
      if (!isCurrentUserAdmin) {
        set.status = 403;
        return { error: 'Only administrators can activate or deactivate users' };
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!targetUser) {
        set.status = 404;
        return { error: 'User not found' };
      }

      const isTargetUserAdmin = targetUser.roles.some((ur) => ur.role.name === 'admin');
      const isSelf = currentUser.userId === params.id;

      // Admin cannot deactivate themselves
      if (isSelf) {
        set.status = 403;
        return { error: 'You cannot change your own status' };
      }

      // Cannot deactivate the primary admin
      if (isTargetUserAdmin && targetUser.email === process.env.ADMIN_EMAIL) {
        set.status = 403;
        return { error: 'Cannot deactivate the primary admin user' };
      }

      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: {
          isActive: !targetUser.isActive,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
        },
      });

      return {
        user: updatedUser,
        message: updatedUser.isActive
          ? 'User activated successfully'
          : 'User deactivated successfully',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Get all available permission levels
  .get('/permissions/all', async () => {
    return {
      permissionLevels: STAFF_PERMISSION_LEVELS,
      permissionLevelInfo: PERMISSION_LEVEL_INFO,
      allLevels: getAllPermissionLevels(),
    };
  })

  // Get default permission level for a role
  .get(
    '/permissions/defaults/:roleName',
    async ({ params, set }) => {
      const { roleName } = params;
      const defaultLevel = DEFAULT_ROLE_PERMISSION_LEVEL[roleName];

      if (defaultLevel === undefined) {
        set.status = 404;
        return { error: 'Role not found' };
      }

      return { permissionLevel: defaultLevel };
    },
    {
      params: t.Object({
        roleName: t.String(),
      }),
    }
  )

  // Update user permission level - ADMIN ONLY
  .patch(
    '/:id/permissions',
    async ({ params, body, set, user: currentUser }) => {
      if (!currentUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      // Only admin can set access levels
      const isCurrentUserAdmin = currentUser.roles.includes('admin');
      if (!isCurrentUserAdmin) {
        set.status = 403;
        return { error: 'Only administrators can set user access levels' };
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!targetUser) {
        set.status = 404;
        return { error: 'User not found' };
      }

      const isTargetUserAdmin = targetUser.roles.some((ur) => ur.role.name === 'admin');

      // Cannot modify the primary admin user
      if (isTargetUserAdmin && targetUser.email === process.env.ADMIN_EMAIL) {
        set.status = 403;
        return { error: 'Cannot modify the primary admin user permissions' };
      }

      // Get the user's current role assignment
      const userRole = targetUser.roles[0];
      if (!userRole) {
        set.status = 400;
        return { error: 'User has no role assigned' };
      }

      // Validate permission level
      const validLevels = Object.values(STAFF_PERMISSION_LEVELS);
      if (body.permissionLevel && !validLevels.includes(body.permissionLevel as typeof validLevels[number])) {
        set.status = 400;
        return { error: 'Invalid permission level. Must be "canEdit" or "canRead"' };
      }

      // Update the permission level
      await prisma.userRole.update({
        where: { id: userRole.id },
        data: {
          permissionLevel: body.permissionLevel,
        },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roles: {
            select: {
              id: true,
              permissionLevel: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return { user: updatedUser, message: 'User permission level updated successfully' };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        permissionLevel: t.Union([t.String(), t.Null()]),
      }),
    }
  );
