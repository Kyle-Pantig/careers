const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApplicationData {
  jobNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  address: string;
  resume: File;
  userId?: string | null;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  address: string;
  resumeUrl: string;
  resumeFileName: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    jobNumber: string;
    location?: string;
    workType?: string;
    jobType?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryPeriod?: string | null;
    salaryCurrency?: string | null;
    industry?: {
      name: string;
    };
  };
}

export interface ApplicationSubmitResult {
  success: boolean;
  message: string;
  application: {
    id: string;
    jobTitle: string;
    jobNumber: string;
    status: string;
    createdAt: string;
  };
}

// Submit a job application
export async function submitApplication(data: ApplicationData): Promise<ApplicationSubmitResult> {
  const formData = new FormData();
  formData.append('jobNumber', data.jobNumber);
  formData.append('firstName', data.firstName);
  formData.append('lastName', data.lastName);
  formData.append('email', data.email);
  formData.append('contactNumber', data.contactNumber);
  formData.append('address', data.address);
  formData.append('resume', data.resume);
  if (data.userId) {
    formData.append('userId', data.userId);
  }

  const res = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to submit application');
  }

  return result;
}

// Check if user has applied for a job
export async function checkApplicationStatus(
  jobNumber: string,
  options: { email?: string; userId?: string }
): Promise<{ hasApplied: boolean; application: { id: string; status: string; createdAt: string } | null }> {
  const params = new URLSearchParams();
  if (options.email) params.set('email', options.email);
  if (options.userId) params.set('userId', options.userId);

  const res = await fetch(`${API_URL}/applications/check/${jobNumber}?${params}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to check application status');
  }

  return result;
}

// Get user's applications
export async function getUserApplications(
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ applications: Application[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());

  const res = await fetch(`${API_URL}/applications/user/${userId}?${params}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch applications');
  }

  return result;
}

// Get all applications (admin)
export async function getAdminApplications(
  options: { page?: number; limit?: number; status?: string; search?: string } = {}
): Promise<{ applications: Application[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  const res = await fetch(`${API_URL}/applications/all?${params}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch applications');
  }

  return result;
}

// Get applications for a job (admin)
export async function getJobApplications(
  jobId: string,
  options: { page?: number; limit?: number; status?: string } = {}
): Promise<{ applications: Application[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.status) params.set('status', options.status);

  const res = await fetch(`${API_URL}/applications/job/${jobId}?${params}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch applications');
  }

  return result;
}

// Get single application
export async function getApplication(id: string): Promise<{ application: Application }> {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch application');
  }

  return result;
}

// Update application status (admin)
export async function updateApplicationStatus(
  id: string,
  data: { status: Application['status']; notes?: string }
): Promise<{ application: Application; message: string }> {
  const res = await fetch(`${API_URL}/applications/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to update application status');
  }

  return result;
}

// Email template types
export type EmailTemplateType = 'interview_invitation' | 'rejection' | 'offer' | 'follow_up';

export interface EmailTemplateData {
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewType?: string;
  additionalNotes?: string;
  // Offer template fields
  salaryAmount?: string;
  salaryCurrency?: string;
  salaryPeriod?: string;
  startDate?: string;
}

// Send custom email to applicant
export async function sendApplicantEmail(
  applicationId: string,
  data: { subject: string; message: string }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to send email');
  }

  return result;
}

// Send template email to applicant
export async function sendTemplateEmailToApplicant(
  applicationId: string,
  data: { templateType: EmailTemplateType; customData?: EmailTemplateData }
): Promise<{ success: boolean; message: string; statusUpdated?: string }> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/email/template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to send email');
  }

  return result;
}
