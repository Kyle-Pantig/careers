import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken, verifyToken, generateEmailToken } from '../lib/auth';
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail } from '../lib/email';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const EMAIL_COOLDOWN_SECONDS = 60; // 1 minute cooldown between email requests

// Cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? 'strict' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Register
  .post(
    '/register',
    async ({ body, set }) => {
      const { firstName, lastName, email, password } = body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        set.status = 400;
        return { error: 'An account with this email address already exists. Please try logging in or use a different email.' };
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Get default user role
      let userRole = await prisma.role.findUnique({ where: { name: 'user' } });
      if (!userRole) {
        userRole = await prisma.role.create({
          data: { name: 'user', description: 'Default user role' },
        });
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          roles: {
            create: { roleId: userRole.id },
          },
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      // Create verification token
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailToken.create({
        data: {
          email,
          token,
          type: 'VERIFICATION',
          expiresAt,
        },
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, token);
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }

      return {
        message: 'Your account has been created successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      };
    },
    {
      body: t.Object({
        firstName: t.String({ minLength: 1 }),
        lastName: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )

  // Login
  .post(
    '/login',
    async ({ body, set, cookie }) => {
      const { email, password } = body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!user) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      // Check if user is active
      if (!user.isActive) {
        set.status = 403;
        return { error: 'Your account has been deactivated. Please contact support for assistance.' };
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      // Check if email is verified
      if (!user.emailVerified) {
        set.status = 403;
        return { error: 'Please verify your email address before logging in. Check your inbox for the verification link.' };
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate token
      const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);
      const token = generateToken({
        userId: user.id,
        email: user.email,
        roles,
      });

      // Set cookie
      cookie.token.set({
        value: token,
        ...COOKIE_OPTIONS,
      });

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          roles,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )

  // Logout
  .post('/logout', ({ cookie }) => {
    cookie.token.set({ value: '', maxAge: 0 });
    return { message: 'You have been signed out successfully.' };
  })

  // Verify Email
  .post(
    '/verify-email',
    async ({ body, set }) => {
      const { token } = body;

      const emailToken = await prisma.emailToken.findUnique({
        where: { token, type: 'VERIFICATION' },
      });

      if (!emailToken) {
        set.status = 400;
        return { error: 'This verification link is invalid or has already been used. Please request a new one.' };
      }

      if (emailToken.expiresAt < new Date()) {
        await prisma.emailToken.delete({ where: { id: emailToken.id } });
        set.status = 400;
        return { error: 'This verification link has expired. Please request a new verification email.' };
      }

      // Update user
      await prisma.user.update({
        where: { email: emailToken.email },
        data: { emailVerified: true },
      });

      // Delete token
      await prisma.emailToken.delete({ where: { id: emailToken.id } });

      return { message: 'Your email has been verified successfully. You can now sign in to your account.' };
    },
    {
      body: t.Object({
        token: t.String(),
      }),
    }
  )

  // Resend Verification Email
  .post(
    '/resend-verification',
    async ({ body, set }) => {
      const { email } = body;

      // Generic message to prevent email enumeration
      const genericMessage = 'We have sent a verification link to your email address.';

      const user = await prisma.user.findUnique({ where: { email } });

      // Return same message whether user exists or not (security best practice)
      if (!user || user.emailVerified) {
        return { message: genericMessage };
      }

      // Check rate limit - find most recent token for this email
      const recentToken = await prisma.emailToken.findFirst({
        where: { email, type: 'VERIFICATION' },
        orderBy: { createdAt: 'desc' },
      });

      if (recentToken) {
        const timeSinceLastRequest = Date.now() - recentToken.createdAt.getTime();
        const cooldownRemaining = Math.ceil((EMAIL_COOLDOWN_SECONDS * 1000 - timeSinceLastRequest) / 1000);
        
        if (cooldownRemaining > 0) {
          set.status = 429;
          return { 
            error: `Please wait ${cooldownRemaining} seconds before requesting another verification email.`,
            cooldown: cooldownRemaining
          };
        }
      }

      // Delete existing verification tokens
      await prisma.emailToken.deleteMany({
        where: { email, type: 'VERIFICATION' },
      });

      // Create new verification token
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailToken.create({
        data: {
          email,
          token,
          type: 'VERIFICATION',
          expiresAt,
        },
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, token);
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }

      return { message: genericMessage, cooldown: EMAIL_COOLDOWN_SECONDS };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
      }),
    }
  )

  // Forgot Password
  .post(
    '/forgot-password',
    async ({ body, set }) => {
      const { email } = body;

      // Generic message to prevent email enumeration
      const genericMessage = 'We have sent password reset instructions to your email address.';

      // Check rate limit first - even if user doesn't exist (prevent enumeration)
      const recentToken = await prisma.emailToken.findFirst({
        where: { email, type: 'PASSWORD_RESET' },
        orderBy: { createdAt: 'desc' },
      });

      if (recentToken) {
        const timeSinceLastRequest = Date.now() - recentToken.createdAt.getTime();
        const cooldownRemaining = Math.ceil((EMAIL_COOLDOWN_SECONDS * 1000 - timeSinceLastRequest) / 1000);
        
        if (cooldownRemaining > 0) {
          set.status = 429;
          return { 
            error: `Please wait ${cooldownRemaining} seconds before requesting another password reset.`,
            cooldown: cooldownRemaining
          };
        }
      }

      const user = await prisma.user.findUnique({ where: { email } });

      // Return same message whether user exists or not (security best practice)
      if (!user) {
        return { message: genericMessage, cooldown: EMAIL_COOLDOWN_SECONDS };
      }

      // Delete existing reset tokens
      await prisma.emailToken.deleteMany({
        where: { email, type: 'PASSWORD_RESET' },
      });

      // Create reset token
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.emailToken.create({
        data: {
          email,
          token,
          type: 'PASSWORD_RESET',
          expiresAt,
        },
      });

      // Send reset email
      try {
        await sendPasswordResetEmail(email, token);
      } catch (error) {
        console.error('Failed to send password reset email:', error);
      }

      return { message: genericMessage, cooldown: EMAIL_COOLDOWN_SECONDS };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
      }),
    }
  )

  // Reset Password
  .post(
    '/reset-password',
    async ({ body, set }) => {
      const { token, password } = body;

      const emailToken = await prisma.emailToken.findUnique({
        where: { token, type: 'PASSWORD_RESET' },
      });

      if (!emailToken) {
        set.status = 400;
        return { error: 'This password reset link is invalid or has already been used. Please request a new one.' };
      }

      if (emailToken.expiresAt < new Date()) {
        await prisma.emailToken.delete({ where: { id: emailToken.id } });
        set.status = 400;
        return { error: 'This password reset link has expired. Please request a new password reset.' };
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update user
      await prisma.user.update({
        where: { email: emailToken.email },
        data: { passwordHash },
      });

      // Delete token
      await prisma.emailToken.delete({ where: { id: emailToken.id } });

      return { message: 'Your password has been reset successfully. You can now sign in with your new password.' };
    },
    {
      body: t.Object({
        token: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    }
  )

  // Request Magic Link
  .post(
    '/magic-link/request',
    async ({ body, set }) => {
      const { email } = body;

      // Generic message to prevent email enumeration
      const genericMessage = 'We have sent a sign-in link to your email address.';

      // Check rate limit first - even if user doesn't exist (prevent enumeration)
      const recentToken = await prisma.emailToken.findFirst({
        where: { email, type: 'MAGIC_LINK' },
        orderBy: { createdAt: 'desc' },
      });

      if (recentToken) {
        const timeSinceLastRequest = Date.now() - recentToken.createdAt.getTime();
        const cooldownRemaining = Math.ceil((EMAIL_COOLDOWN_SECONDS * 1000 - timeSinceLastRequest) / 1000);
        
        if (cooldownRemaining > 0) {
          set.status = 429;
          return { 
            error: `Please wait ${cooldownRemaining} seconds before requesting another sign-in link.`,
            cooldown: cooldownRemaining
          };
        }
      }

      const user = await prisma.user.findUnique({ where: { email } });

      // User must have an account to use magic link
      if (!user) {
        set.status = 400;
        return { error: 'No account found. Please sign up first.' };
      }

      if (!user.isActive) {
        set.status = 403;
        return { error: 'Your account has been deactivated. Please contact support for assistance.' };
      }

      // Delete existing magic link tokens for this user
      await prisma.emailToken.deleteMany({
        where: { email, type: 'MAGIC_LINK' },
      });

      // Create magic link token (expires in 15 minutes)
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.emailToken.create({
        data: {
          email,
          token,
          type: 'MAGIC_LINK',
          expiresAt,
        },
      });

      // Send magic link email
      try {
        await sendMagicLinkEmail(email, token);
      } catch (error) {
        console.error('Failed to send magic link email:', error);
      }

      return { message: genericMessage, cooldown: EMAIL_COOLDOWN_SECONDS };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
      }),
    }
  )

  // Verify Magic Link and Login
  .post(
    '/magic-link/verify',
    async ({ body, set, cookie }) => {
      const { token } = body;

      const emailToken = await prisma.emailToken.findUnique({
        where: { token, type: 'MAGIC_LINK' },
      });

      if (!emailToken) {
        set.status = 400;
        return { error: 'This sign-in link is invalid or has already been used. Please request a new one.' };
      }

      if (emailToken.expiresAt < new Date()) {
        await prisma.emailToken.delete({ where: { id: emailToken.id } });
        set.status = 400;
        return { error: 'This sign-in link has expired. Please request a new one.' };
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: emailToken.email },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!user) {
        set.status = 400;
        return { error: 'User not found.' };
      }

      if (!user.isActive) {
        set.status = 403;
        return { error: 'Your account has been deactivated. Please contact support for assistance.' };
      }

      // Delete token (one-time use)
      await prisma.emailToken.delete({ where: { id: emailToken.id } });

      // Mark email as verified (since they received the email)
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT token
      const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);
      const jwtToken = generateToken({
        userId: user.id,
        email: user.email,
        roles,
      });

      // Set cookie
      cookie.token.set({
        value: jwtToken,
        ...COOKIE_OPTIONS,
      });

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: true,
          roles,
        },
      };
    },
    {
      body: t.Object({
        token: t.String(),
      }),
    }
  )

  // Get current user (from cookie)
  .get('/me', async ({ cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      cookie.token.set({ value: '', maxAge: 0 });
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    }) as any;

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    // Get permission level for staff users
    const isAdmin = user.roles.some((ur: { role: { name: string } }) => ur.role.name === 'admin');
    const staffRole = user.roles.find((ur: { role: { name: string } }) => ur.role.name === 'staff');
    
    // Determine permission level:
    // - Admin: 'canEdit' (full access)
    // - Staff: their assigned permissionLevel ('canEdit' or 'canRead')
    // - User: null (no admin permissions)
    let permissionLevel: string | null = null;
    if (isAdmin) {
      permissionLevel = 'canEdit';
    } else if (staffRole) {
      permissionLevel = staffRole.permissionLevel || 'canRead';
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        contactNumber: user.contactNumber,
        address: user.address,
        resumeUrl: user.resumeUrl,
        resumeFileName: user.resumeFileName,
        resumeUploadedAt: user.resumeUploadedAt,
        roles: user.roles.map((ur: { role: { name: string } }) => ur.role.name),
        permissionLevel,
      },
    };
  })

  // Update current user profile
  .patch('/me', async ({ body, cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      cookie.token.set({ value: '', maxAge: 0 });
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const { firstName, lastName, contactNumber, address } = body;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        firstName,
        lastName,
        contactNumber,
        address,
      } as any,
      include: {
        roles: { include: { role: true } },
      },
    }) as any;

    return {
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        contactNumber: user.contactNumber,
        address: user.address,
        resumeUrl: user.resumeUrl,
        resumeFileName: user.resumeFileName,
        resumeUploadedAt: user.resumeUploadedAt,
        roles: user.roles.map((ur: { role: { name: string } }) => ur.role.name),
      },
    };
  }, {
    body: t.Object({
      firstName: t.String({ minLength: 1 }),
      lastName: t.String({ minLength: 1 }),
      contactNumber: t.Optional(t.String()),
      address: t.Optional(t.String()),
    }),
  })

  // Upload user resume
  .post('/me/resume', async ({ body, cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      cookie.token.set({ value: '', maxAge: 0 });
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const { resume } = body as { resume: File };

    if (!resume) {
      set.status = 400;
      return { error: 'Resume file is required' };
    }

    // Validate file type
    if (resume.type !== 'application/pdf') {
      set.status = 400;
      return { error: 'Only PDF files are allowed' };
    }

    // Validate file size (5MB max)
    if (resume.size > 5 * 1024 * 1024) {
      set.status = 400;
      return { error: 'File size must be less than 5MB' };
    }

    // Import storage helper
    const { uploadResume, deleteResume } = await import('../lib/storage');

    // Get current user to check for existing resume
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    }) as any;

    // Delete old resume if exists
    if (currentUser?.resumeUrl) {
      try {
        // Extract path from URL (format: .../bucket/userId/filename)
        const urlParts = currentUser.resumeUrl.split('/');
        const fileName = urlParts.pop();
        const odlUserId = urlParts.pop();
        if (fileName && odlUserId) {
          await deleteResume(`${odlUserId}/${fileName}`, 'user');
        }
      } catch (err) {
        console.error('Failed to delete old resume:', err);
      }
    }

    // Upload new resume
    const resumeUrl = await uploadResume(resume, 'user', payload.userId);

    // Update user with resume info
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        resumeUrl,
        resumeFileName: resume.name,
        resumeUploadedAt: new Date(),
      } as any,
      include: {
        roles: { include: { role: true } },
      },
    }) as any;

    return {
      message: 'Resume uploaded successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        contactNumber: user.contactNumber,
        address: user.address,
        resumeUrl: user.resumeUrl,
        resumeFileName: user.resumeFileName,
        resumeUploadedAt: user.resumeUploadedAt,
        roles: user.roles.map((ur: { role: { name: string } }) => ur.role.name),
      },
    };
  })

  // Delete user resume
  .delete('/me/resume', async ({ cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      cookie.token.set({ value: '', maxAge: 0 });
      set.status = 401;
      return { error: 'Invalid token' };
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    }) as any;

    if (!currentUser?.resumeUrl) {
      set.status = 400;
      return { error: 'No resume to delete' };
    }

    // Delete from storage
    const { deleteResume } = await import('../lib/storage');
    try {
      // Extract path from URL (format: .../bucket/userId/filename)
      const urlParts = currentUser.resumeUrl.split('/');
      const fileName = urlParts.pop();
      const oldUserId = urlParts.pop();
      if (fileName && oldUserId) {
        await deleteResume(`${oldUserId}/${fileName}`, 'user');
      }
    } catch (err) {
      console.error('Failed to delete resume from storage:', err);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        resumeUrl: null,
        resumeFileName: null,
        resumeUploadedAt: null,
      } as any,
      include: {
        roles: { include: { role: true } },
      },
    }) as any;

    return {
      message: 'Resume deleted successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        contactNumber: user.contactNumber,
        address: user.address,
        resumeUrl: user.resumeUrl,
        resumeFileName: user.resumeFileName,
        resumeUploadedAt: user.resumeUploadedAt,
        roles: user.roles.map((ur: { role: { name: string } }) => ur.role.name),
      },
    };
  })

  // Change password
  .post('/me/change-password', async ({ body, cookie, set }) => {
    const token = cookie.token?.value;
    
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      cookie.token.set({ value: '', maxAge: 0 });
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const { currentPassword, newPassword } = body;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      set.status = 400;
      return { error: 'Current password is incorrect' };
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      set.status = 400;
      return { error: 'New password must be different from current password' };
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newPasswordHash },
    });

    return {
      message: 'Password changed successfully',
    };
  }, {
    body: t.Object({
      currentPassword: t.String({ minLength: 1 }),
      newPassword: t.String({ minLength: 8 }),
    }),
  });
