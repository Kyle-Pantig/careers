import { z } from 'zod';

// Common field validators
export const emailSchema = z.string().email('Please enter a valid email address');

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const nameSchema = z.string().min(1, 'This field is required');

// Form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const signupSchema = z
  .object({
    firstName: nameSchema.refine((val) => val.length > 0, 'First name is required'),
    lastName: nameSchema.refine((val) => val.length > 0, 'Last name is required'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
