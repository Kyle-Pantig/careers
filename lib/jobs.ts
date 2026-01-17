import type { Industry } from './industries';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type WorkType = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP' | 'TEMPORARY';
export type ShiftType = 'DAY' | 'NIGHT' | 'ROTATING' | 'FLEXIBLE';
export type SalaryPeriod = 'HOURLY' | 'MONTHLY' | 'YEARLY';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'PHP' | 'JPY' | 'AUD' | 'CAD' | 'SGD' | 'INR' | 'CNY';

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  industryId: string;
  industry: Industry;
  location: string;
  workType: WorkType;
  jobType: JobType;
  shiftType: ShiftType;
  experienceMin: number;
  experienceMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: Currency;
  salaryPeriod: SalaryPeriod;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
    views: number;
  };
}

export interface CreateJobData {
  title: string;
  description: string;
  industryId: string;
  location: string;
  workType: WorkType;
  jobType: JobType;
  shiftType: ShiftType;
  experienceMin: number;
  experienceMax?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: Currency;
  salaryPeriod?: SalaryPeriod;
  isPublished?: boolean;
  expiresAt?: string;
}

export interface UpdateJobData extends CreateJobData {
  id: string;
}

export interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  workType?: WorkType;
  industryId?: string;
  location?: string;
  isPublished?: boolean;
}

// Get all jobs (admin view - includes unpublished)
export async function getAdminJobs(filters: JobFilters = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.search) params.set('search', filters.search);
  if (filters.workType) params.set('workType', filters.workType);
  if (filters.industryId) params.set('industryId', filters.industryId);
  if (filters.isPublished !== undefined) params.set('isPublished', filters.isPublished.toString());

  const res = await fetch(`${API_URL}/jobs/admin?${params}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return res.json();
}

// Get all published jobs (public view)
export async function getJobs(filters: JobFilters = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.search) params.set('search', filters.search);
  if (filters.workType) params.set('workType', filters.workType);
  if (filters.industryId) params.set('industryId', filters.industryId);
  if (filters.location) params.set('location', filters.location);

  const res = await fetch(`${API_URL}/jobs?${params}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return res.json();
}

// Get single job by ID
export async function getJob(id: string): Promise<{ job: Job }> {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch job');
  }

  return result;
}

// Get single job by job number
export async function getJobByNumber(jobNumber: string): Promise<{ job: Job }> {
  const res = await fetch(`${API_URL}/jobs/number/${jobNumber}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch job');
  }

  return result;
}

// Create job
export async function createJob(data: CreateJobData): Promise<{ job: Job; message: string }> {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to create job');
  }

  return result;
}

// Update job
export async function updateJob(id: string, data: CreateJobData): Promise<{ job: Job; message: string }> {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to update job');
  }

  return result;
}

// Delete job
export async function deleteJob(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to delete job');
  }

  return result;
}

// Toggle publish status
export async function toggleJobPublish(id: string): Promise<{ job: Job; message: string }> {
  const res = await fetch(`${API_URL}/jobs/${id}/publish`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to toggle publish status');
  }

  return result;
}

// Track job view
export async function trackJobView(
  jobNumber: string,
  userId?: string | null
): Promise<{ success: boolean; message: string; newView: boolean }> {
  const res = await fetch(`${API_URL}/jobs/${jobNumber}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to track view');
  }

  return result;
}
