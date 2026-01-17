import { z } from 'zod';

export const workTypeSchema = z.enum(['ONSITE', 'REMOTE', 'HYBRID']);
export const jobTypeSchema = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY']);
export const shiftTypeSchema = z.enum(['DAY', 'NIGHT', 'ROTATING', 'FLEXIBLE']);
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'PHP', 'JPY', 'AUD', 'CAD', 'SGD', 'INR', 'CNY']);
export const salaryPeriodSchema = z.enum(['HOURLY', 'MONTHLY', 'YEARLY']);

export const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(10000, 'Description must be less than 10000 characters'),
  industryId: z.string().min(1, 'Industry is required'),
  location: z.string().min(1, 'Location is required').max(200, 'Location must be less than 200 characters'),
  workType: workTypeSchema,
  jobType: jobTypeSchema,
  shiftType: shiftTypeSchema,
  experienceMin: z.number().min(0, 'Minimum experience must be 0 or more').max(50, 'Maximum 50 years'),
  experienceMax: z.number().min(0).max(50).optional().nullable(),
  salaryMin: z.number().min(0, 'Salary must be positive').optional().nullable(),
  salaryMax: z.number().min(0, 'Salary must be positive').optional().nullable(),
  salaryCurrency: currencySchema,
  salaryPeriod: salaryPeriodSchema,
  isPublished: z.boolean(),
  expiresAt: z.string().optional().nullable(),
});

export const industrySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().optional().default(true),
});

export type JobFormData = z.infer<typeof jobSchema>;
export type IndustryFormData = z.infer<typeof industrySchema>;
export type WorkType = z.infer<typeof workTypeSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type ShiftType = z.infer<typeof shiftTypeSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type SalaryPeriod = z.infer<typeof salaryPeriodSchema>;

// Work type labels
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  ONSITE: 'On-site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

// Job type labels
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

// Shift type labels
export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  DAY: 'Day Shift',
  NIGHT: 'Night Shift',
  ROTATING: 'Rotating Shift',
  FLEXIBLE: 'Flexible Hours',
};

// Currency labels and symbols
export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'USD - US Dollar',
  EUR: 'EUR - Euro',
  GBP: 'GBP - British Pound',
  PHP: 'PHP - Philippine Peso',
  JPY: 'JPY - Japanese Yen',
  AUD: 'AUD - Australian Dollar',
  CAD: 'CAD - Canadian Dollar',
  SGD: 'SGD - Singapore Dollar',
  INR: 'INR - Indian Rupee',
  CNY: 'CNY - Chinese Yuan',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  PHP: '₱',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  INR: '₹',
  CNY: '¥',
};

// Salary period labels
export const SALARY_PERIOD_LABELS: Record<SalaryPeriod, string> = {
  HOURLY: 'per hour',
  MONTHLY: 'per month',
  YEARLY: 'per year',
};
