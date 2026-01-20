import { Job } from './jobs';

const API_URL = '/api/proxy';

export interface SavedJob {
  id: string;
  savedAt: string;
  job: Job;
}

export interface SavedJobsResponse {
  savedJobs: SavedJob[];
}

// Get all saved jobs for current user
export async function getSavedJobs(): Promise<SavedJobsResponse> {
  const response = await fetch(`${API_URL}/saved-jobs`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch saved jobs');
  }

  return response.json();
}

// Check if a job is saved
export async function checkJobSaved(jobId: string): Promise<{ isSaved: boolean }> {
  const response = await fetch(`${API_URL}/saved-jobs/check/${jobId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    return { isSaved: false };
  }

  return response.json();
}

// Save a job
export async function saveJob(jobId: string): Promise<{ requiresLogin?: boolean; savedJob?: SavedJob; message?: string }> {
  const response = await fetch(`${API_URL}/saved-jobs/${jobId}`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.requiresLogin) {
      return { requiresLogin: true };
    }
    throw new Error(data.error || 'Failed to save job');
  }

  return data;
}

// Unsave a job
export async function unsaveJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/saved-jobs/${jobId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unsave job');
  }
}
