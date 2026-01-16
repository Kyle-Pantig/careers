import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSavedJobs, checkJobSaved, saveJob, unsaveJob, SavedJob } from '@/lib/saved-jobs';

// Query keys
export const savedJobsKeys = {
  all: ['saved-jobs'] as const,
  check: (jobId: string) => ['saved-jobs', 'check', jobId] as const,
};

// Get all saved jobs
export function useSavedJobs() {
  return useQuery({
    queryKey: savedJobsKeys.all,
    queryFn: getSavedJobs,
    select: (data) => data.savedJobs,
  });
}

// Check if a specific job is saved
export function useCheckJobSaved(jobId: string) {
  return useQuery({
    queryKey: savedJobsKeys.check(jobId),
    queryFn: () => checkJobSaved(jobId),
    select: (data) => data.isSaved,
    enabled: !!jobId,
  });
}

// Save a job
export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveJob,
    onSuccess: (data, jobId) => {
      // Invalidate saved jobs list
      queryClient.invalidateQueries({ queryKey: savedJobsKeys.all });
      // Update the check query for this job
      queryClient.setQueryData(savedJobsKeys.check(jobId), { isSaved: true });
    },
  });
}

// Unsave a job
export function useUnsaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsaveJob,
    onSuccess: (_, jobId) => {
      // Invalidate saved jobs list
      queryClient.invalidateQueries({ queryKey: savedJobsKeys.all });
      // Update the check query for this job
      queryClient.setQueryData(savedJobsKeys.check(jobId), { isSaved: false });
    },
  });
}

// Toggle save status
export function useToggleSaveJob() {
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();

  const toggleSave = async (jobId: string, isSaved: boolean) => {
    if (isSaved) {
      return unsaveJobMutation.mutateAsync(jobId);
    } else {
      return saveJobMutation.mutateAsync(jobId);
    }
  };

  return {
    toggleSave,
    isPending: saveJobMutation.isPending || unsaveJobMutation.isPending,
    saveResult: saveJobMutation.data,
  };
}
