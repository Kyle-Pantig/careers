import { Elysia, t } from 'elysia';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken, verifyToken, generateEmailToken } from '../lib/auth';
import { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail, sendUserInvitationEmail } from '../lib/email';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const EMAIL_COOLDOWN_SECONDS = 60; // 1 minute cooldown between email requests

// Better detection for cross-site cookie requirements (e.g. Vercel -> Railway)
// If frontend URL is NOT localhost, we likely need cross-site cookies
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const IS_CROSS_SITE = IS_PRODUCTION || !!(FRONTEND_URL && !FRONTEND_URL.includes('localhost') && !FRONTEND_URL.includes('127.0.0.1'));

// Cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  // Secure is REQUIRED for SameSite='none'
  secure: IS_CROSS_SITE,
  // Cross-site auth requires 'none'
  sameSite: IS_CROSS_SITE ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Register
  .post(
    '/register',
    async ({ body, set }) => {
      const { firstName, lastName, email, password } = body;
      const normalizedEmail = email.toLowerCase();

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
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
          email: normalizedEmail,
          passwordHash,
          roles: {
            create: { roleId: userRole.id },
          },
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      // Link any existing guest applications that used this email
      await prisma.jobApplication.updateMany({
        where: {
          email: normalizedEmail,
          userId: null,
        },
        data: {
          userId: user.id,
        },
      });

      // Create verification token
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailToken.create({
        data: {
          email: normalizedEmail,
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
      const normalizedEmail = email.toLowerCase();

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
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

      // Check if user has a password (OAuth-only users don't)
      if (!user.passwordHash) {
        set.status = 401;
        return { error: 'This account uses Google sign-in. Please continue with Google instead.' };
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
        // Return token in response body for mobile devices that block cookies
        token,
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
    // Must use same options as when setting the cookie for it to be properly cleared
    cookie.token.set({
      value: '',
      ...COOKIE_OPTIONS,
      maxAge: 0
    });
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
      const normalizedEmail = email.toLowerCase();

      // Generic message to prevent email enumeration
      const genericMessage = 'We have sent a verification link to your email address.';

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      // Return same message whether user exists or not (security best practice)
      if (!user || user.emailVerified) {
        return { message: genericMessage };
      }

      // Check rate limit - find most recent token for this email
      const recentToken = await prisma.emailToken.findFirst({
        where: { email: normalizedEmail, type: 'VERIFICATION' },
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
        where: { email: normalizedEmail, type: 'VERIFICATION' },
      });

      // Create new verification token
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailToken.create({
        data: {
          email: normalizedEmail,
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
      const normalizedEmail = email.toLowerCase();

      // Generic message to prevent email enumeration
      const genericMessage = 'We have sent password reset instructions to your email address.';

      // Check rate limit first - even if user doesn't exist (prevent enumeration)
      const recentToken = await prisma.emailToken.findFirst({
        where: { email: normalizedEmail, type: 'PASSWORD_RESET' },
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

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      // Return same message whether user exists or not (security best practice)
      if (!user) {
        return { message: genericMessage, cooldown: EMAIL_COOLDOWN_SECONDS };
      }

      // Delete existing reset tokens
      await prisma.emailToken.deleteMany({
        where: { email: normalizedEmail, type: 'PASSWORD_RESET' },
      });

      // Create reset token
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.emailToken.create({
        data: {
          email: normalizedEmail,
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
      const normalizedEmail = email.toLowerCase();

      // Generic message to prevent email enumeration
      const genericMessage = 'We have sent a sign-in link to your email address.';

      // Check rate limit first - even if user doesn't exist (prevent enumeration)
      const recentToken = await prisma.emailToken.findFirst({
        where: { email: normalizedEmail, type: 'MAGIC_LINK' },
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

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

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
        where: { email: normalizedEmail, type: 'MAGIC_LINK' },
      });

      // Create magic link token (expires in 15 minutes)
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.emailToken.create({
        data: {
          email: normalizedEmail,
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
      return { user: null };
    }

    const payload = verifyToken(token as string);

    if (!payload) {
      cookie.token.set({ value: '', maxAge: 0 });
      return { user: null };
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

    // Check if user is the super admin (primary admin from env)
    const isSuperAdmin = isAdmin && user.email === process.env.ADMIN_EMAIL;

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
        isSuperAdmin,
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

    // Check if user has a password (credentials account)
    if (!user.passwordHash) {
      set.status = 400;
      return { error: 'Cannot change password for OAuth-only accounts. Please link a password first.' };
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
  })

  // Set password for OAuth-only users (no existing password)
  .post('/me/set-password', async ({ body, cookie, set }) => {
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

    const { password } = body;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    // Check if user already has a password
    if (user.passwordHash) {
      set.status = 400;
      return { error: 'You already have a password set. Use change password instead.' };
    }

    // Hash and set password
    const newPasswordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Also create a credentials account entry if not exists
    const existingCredentialsAccount = await (prisma as any).account.findFirst({
      where: {
        userId: payload.userId,
        provider: 'CREDENTIALS',
      },
    });

    if (!existingCredentialsAccount) {
      await (prisma as any).account.create({
        data: {
          userId: payload.userId,
          provider: 'CREDENTIALS',
          providerAccountId: payload.userId, // Use userId as providerAccountId for credentials
        },
      });
    }

    return {
      message: 'Password set successfully. You can now log in with your email and password.',
    };
  }, {
    body: t.Object({
      password: t.String({ minLength: 8 }),
    }),
  })

  // ============================================
  // Google OAuth Routes
  // ============================================

  // Google Sign-In - verify Google access token and create/get user
  .post(
    '/google',
    async ({ body, set, cookie }) => {
      const { credential } = body;

      try {
        // Get user info from Google using the access token (v3 API)
        const googleResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${credential}` }
          }
        );

        if (!googleResponse.ok) {
          set.status = 401;
          return { error: 'Invalid Google token' };
        }

        const googleData = await googleResponse.json();
        const { email, name, picture, sub: googleId, given_name, family_name, email_verified } = googleData;

        if (!email) {
          set.status = 401;
          return { error: 'No email from Google' };
        }

        const normalizedEmail = email.toLowerCase();

        // Check if Google account is already linked to a user
        const existingAccount = await (prisma as any).account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: 'GOOGLE',
              providerAccountId: googleId,
            },
          },
          include: {
            user: {
              include: {
                roles: { include: { role: true } },
              },
            },
          },
        });

        if (existingAccount) {
          // User already has Google linked - log them in
          const user = existingAccount.user;

          if (!user.isActive) {
            set.status = 403;
            return { error: 'Your account has been deactivated. Please contact support for assistance.' };
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Generate token and set cookie
          const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);
          const jwtToken = generateToken({
            userId: user.id,
            email: user.email,
            roles,
          });

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
              emailVerified: user.emailVerified,
              roles,
            },
          };
        }

        // Check if a user with this email exists (credentials account)
        const existingUser = await (prisma.user.findUnique as any)({
          where: { email: normalizedEmail },
          include: {
            accounts: true,
            roles: { include: { role: true } },
          },
        });

        if (existingUser) {
          // Check if this is an invited user who hasn't set up their password yet
          // They need to accept their invitation first to set up a password
          if (!existingUser.passwordHash) {
            set.status = 400;
            return {
              error: 'Please accept your invitation first. Check your email for the invitation link to set up your account and password.',
              requiresInvitation: true,
            };
          }

          // User exists with credentials (has password) - need to link accounts
          // Create a temporary token
          const linkToken = generateEmailToken();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

          await (prisma.emailToken.create as any)({
            data: {
              email: normalizedEmail,
              token: linkToken,
              type: 'ACCOUNT_LINK',
              expiresAt,
            },
          });

          // Return link required response with Google user info
          set.status = 409; // Conflict - account exists
          return {
            error: 'Account exists with this email',
            requiresLink: true,
            linkToken,
            provider: 'google',
            providerName: name || `${given_name} ${family_name}`,
            email,
            googleId,
          };
        }

        // New user - create account with Google
        let userRole = await prisma.role.findUnique({ where: { name: 'user' } });
        if (!userRole) {
          userRole = await prisma.role.create({
            data: { name: 'user', description: 'Default user role' },
          });
        }

        // Create the user
        const newUser = await (prisma.user.create as any)({
          data: {
            firstName: given_name || name?.split(' ')[0] || 'User',
            lastName: family_name || name?.split(' ').slice(1).join(' ') || '',
            email: normalizedEmail,
            emailVerified: email_verified || true, // Google accounts are verified
            passwordHash: null,
            roles: {
              create: { roleId: userRole.id },
            },
            accounts: {
              create: {
                provider: 'GOOGLE',
                providerAccountId: googleId,
              },
            },
          },
          include: {
            roles: { include: { role: true } },
          },
        });

        // Link any existing guest applications that used this email
        await prisma.jobApplication.updateMany({
          where: {
            email: normalizedEmail,
            userId: null,
          },
          data: {
            userId: newUser.id,
          },
        });

        // Update last login
        await prisma.user.update({
          where: { id: newUser.id },
          data: { lastLoginAt: new Date() },
        });

        // Generate token and set cookie
        const roles = newUser.roles.map((ur: { role: { name: string } }) => ur.role.name);
        const jwtToken = generateToken({
          userId: newUser.id,
          email: newUser.email,
          roles,
        });

        cookie.token.set({
          value: jwtToken,
          ...COOKIE_OPTIONS,
        });

        return {
          user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            emailVerified: newUser.emailVerified,
            roles,
          },
          isNewUser: true,
        };
      } catch (err) {
        console.error('Google auth error:', err);
        set.status = 500;
        return { error: 'Failed to authenticate with Google' };
      }
    },
    {
      body: t.Object({
        credential: t.String(),
      }),
    }
  )


  // Confirm linking Google account to existing credentials account
  .post(
    '/link-account/confirm',
    async ({ body, set, cookie }) => {
      const { token, password } = body;

      // Find the link token
      const emailToken = await (prisma.emailToken.findUnique as any)({
        where: { token, type: 'ACCOUNT_LINK' },
      });

      if (!emailToken) {
        set.status = 400;
        return { error: 'Invalid or expired link token. Please try signing in with Google again.' };
      }

      if (emailToken.expiresAt < new Date()) {
        await prisma.emailToken.delete({ where: { id: emailToken.id } });
        set.status = 400;
        return { error: 'Link token has expired. Please try signing in with Google again.' };
      }

      // Find the user
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

      // Verify password
      if (!user.passwordHash) {
        set.status = 400;
        return { error: 'Account does not have a password set.' };
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        set.status = 401;
        return { error: 'Invalid password.' };
      }

      // Delete the link token
      await prisma.emailToken.delete({ where: { id: emailToken.id } });

      // Now we need to initiate a new Google OAuth flow to get the Google user info
      // Return a success response with the email - the frontend will redirect to Google OAuth again
      return {
        message: 'Password verified. Please complete the linking process.',
        needsGoogleAuth: true,
        email: user.email,
      };
    },
    {
      body: t.Object({
        token: t.String(),
        password: t.String(),
      }),
    }
  )

  // Complete the account linking after password verification
  .post(
    '/link-account/complete',
    async ({ body, set, cookie }) => {
      const { email, googleId } = body;

      // Find the user
      const user = await (prisma.user.findUnique as any)({
        where: { email },
        include: {
          accounts: true,
          roles: { include: { role: true } },
        },
      });

      if (!user) {
        set.status = 400;
        return { error: 'User not found.' };
      }

      // Check if Google account is already linked
      const hasGoogle = user.accounts.some((acc: any) => acc.provider === 'GOOGLE');
      if (hasGoogle) {
        set.status = 400;
        return { error: 'Google account is already linked.' };
      }

      // Check if this Google account is linked to another user
      const existingGoogleAccount = await (prisma as any).account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'GOOGLE',
            providerAccountId: googleId,
          },
        },
      });

      if (existingGoogleAccount) {
        set.status = 400;
        return { error: 'This Google account is already linked to another user.' };
      }

      // Link the Google account
      await (prisma as any).account.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE',
          providerAccountId: googleId,
        },
      });

      // Mark email as verified if not already
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

      // Generate token and set cookie
      const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);
      const jwtToken = generateToken({
        userId: user.id,
        email: user.email,
        roles,
      });

      cookie.token.set({
        value: jwtToken,
        ...COOKIE_OPTIONS,
      });

      return {
        message: 'Google account linked successfully.',
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
        email: t.String({ format: 'email' }),
        googleId: t.String(),
      }),
    }
  )


  // Get linked accounts for current user
  .get('/me/accounts', async ({ cookie, set }) => {
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

    const user = await (prisma.user.findUnique as any)({
      where: { id: payload.userId },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    // Determine if user has credentials (password)
    const hasCredentials = !!user.passwordHash;

    return {
      accounts: user.accounts.map((acc: any) => ({
        id: acc.id,
        provider: acc.provider,
        linkedAt: acc.createdAt,
      })),
      hasCredentials,
    };
  })

  // ============================================
  // User Invitation (Admin Only)
  // ============================================

  // Invite a user (admin only)
  .post(
    '/invite',
    async ({ body, cookie, set }) => {
      const { email, role, permissionLevel } = body;

      // Verify admin is logged in
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

      // Check if requester is admin
      const adminUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!adminUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const isAdmin = adminUser.roles.some(r => r.role.name === 'admin');
      if (!isAdmin) {
        set.status = 403;
        return { error: 'Only admins can invite users' };
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        set.status = 400;
        return { error: 'A user with this email already exists' };
      }

      // Get the role
      const roleRecord = await prisma.role.findUnique({ where: { name: role } });
      if (!roleRecord) {
        set.status = 400;
        return { error: 'Invalid role' };
      }

      // Create the user without password (will be set on acceptance)
      // User is inactive until they accept the invitation
      const newUser = await prisma.user.create({
        data: {
          firstName: '', // Will be set on acceptance
          lastName: '',  // Will be set on acceptance
          email,
          passwordHash: null as any, // No password yet
          emailVerified: true, // Auto-verified for invited users
          isActive: false, // Inactive until invitation is accepted
          roles: {
            create: {
              roleId: roleRecord.id,
              permissionLevel: role === 'staff' ? permissionLevel : null,
            },
          },
        },
      });

      // Generate invitation token (7 days expiry)
      const invitationToken = generateEmailToken();
      await prisma.emailToken.create({
        data: {
          email,
          token: invitationToken,
          type: 'INVITATION' as any,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send invitation email
      try {
        await sendUserInvitationEmail({
          email,
          role,
          invitedBy: `${adminUser.firstName} ${adminUser.lastName}`,
          token: invitationToken,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails, user can still be found in the list
      }

      return {
        success: true,
        message: `Invitation sent to ${email}`,
        user: {
          id: newUser.id,
          email: newUser.email,
          role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        role: t.Union([t.Literal('admin'), t.Literal('staff')]),
        permissionLevel: t.Optional(t.String()),
      }),
    }
  )

  // Verify invitation token (check if valid)
  .get(
    '/invitation/verify',
    async ({ query, set }) => {
      const { token } = query;

      if (!token) {
        set.status = 400;
        return { error: 'Token is required' };
      }

      const emailToken = await prisma.emailToken.findUnique({
        where: { token },
      });

      if (!emailToken || emailToken.type !== ('INVITATION' as any)) {
        set.status = 400;
        return { error: 'Invalid invitation token', valid: false };
      }

      if (emailToken.expiresAt < new Date()) {
        set.status = 400;
        return { error: 'Invitation has expired', valid: false };
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { email: emailToken.email },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!user) {
        set.status = 400;
        return { error: 'User not found', valid: false };
      }

      // Check if user already has a password (invitation already accepted)
      if (user.passwordHash) {
        set.status = 400;
        return { error: 'Invitation has already been accepted', valid: false };
      }

      const roleName = user.roles[0]?.role.name || 'staff';

      return {
        valid: true,
        email: emailToken.email,
        role: roleName,
      };
    },
    {
      query: t.Object({
        token: t.String(),
      }),
    }
  )

  // Accept invitation and set up account
  .post(
    '/invitation/accept',
    async ({ body, cookie, set }) => {
      const { token, firstName, lastName, password } = body;

      // Find the invitation token
      const emailToken = await prisma.emailToken.findUnique({
        where: { token },
      });

      if (!emailToken || emailToken.type !== ('INVITATION' as any)) {
        set.status = 400;
        return { error: 'Invalid invitation token' };
      }

      if (emailToken.expiresAt < new Date()) {
        set.status = 400;
        return { error: 'Invitation has expired' };
      }

      // Find the user
      const user = await prisma.user.findUnique({
        where: { email: emailToken.email },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!user) {
        set.status = 400;
        return { error: 'User not found' };
      }

      // Check if already set up
      if (user.passwordHash) {
        set.status = 400;
        return { error: 'Account has already been set up' };
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Update user with name, password and activate the account
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          passwordHash,
          isActive: true, // Activate account on acceptance
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      // Link any existing guest applications that used this email
      await prisma.jobApplication.updateMany({
        where: {
          email: updatedUser.email.toLowerCase(),
          userId: null,
        },
        data: {
          userId: updatedUser.id,
        },
      });

      // Delete the invitation token
      await prisma.emailToken.delete({
        where: { token },
      });

      // Create credentials account entry
      await (prisma as any).account.create({
        data: {
          userId: updatedUser.id,
          provider: 'CREDENTIALS',
          providerAccountId: updatedUser.id, // Use user ID as provider account ID for credentials
        },
      });

      // Generate JWT and set cookie
      const roles = updatedUser.roles.map(r => r.role.name);
      const jwtToken = generateToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        roles,
      });

      cookie.token.set({
        value: jwtToken,
        ...COOKIE_OPTIONS,
      });

      return {
        success: true,
        message: 'Account set up successfully',
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
          roles,
        },
      };
    },
    {
      body: t.Object({
        token: t.String(),
        firstName: t.String({ minLength: 1 }),
        lastName: t.String({ minLength: 1 }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )

  // Resend invitation (admin only)
  .post(
    '/invitation/resend',
    async ({ body, cookie, set }) => {
      const { userId } = body;

      // Verify admin is logged in
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

      // Check if requester is admin
      const adminUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!adminUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const isAdmin = adminUser.roles.some(r => r.role.name === 'admin');
      if (!isAdmin) {
        set.status = 403;
        return { error: 'Only admins can resend invitations' };
      }

      // Find the invited user
      const invitedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (!invitedUser) {
        set.status = 404;
        return { error: 'User not found' };
      }

      // Check if user already has a password (already set up)
      if (invitedUser.passwordHash) {
        set.status = 400;
        return { error: 'User has already set up their account' };
      }

      // Delete any existing invitation tokens for this email
      await prisma.emailToken.deleteMany({
        where: {
          email: invitedUser.email,
          type: 'INVITATION' as any,
        },
      });

      // Generate new invitation token
      const invitationToken = generateEmailToken();
      await prisma.emailToken.create({
        data: {
          email: invitedUser.email,
          token: invitationToken,
          type: 'INVITATION' as any,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const roleName = invitedUser.roles[0]?.role.name || 'staff';

      // Send invitation email
      try {
        await sendUserInvitationEmail({
          email: invitedUser.email,
          role: roleName,
          invitedBy: `${adminUser.firstName} ${adminUser.lastName}`,
          token: invitationToken,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        set.status = 500;
        return { error: 'Failed to send invitation email' };
      }

      return {
        success: true,
        message: `Invitation resent to ${invitedUser.email}`,
      };
    },
    {
      body: t.Object({
        userId: t.String(),
      }),
    }
  );
