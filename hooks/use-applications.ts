import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJobApplications,
  getApplication,
  updateApplicationStatus,
  getUserApplications,
  getPendingApplicationsCount,
  type Application,
} from '@/lib/applications';

// Fetch user's applications
export function useUserApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ['applications', 'user', userId],
    queryFn: () => getUserApplications(userId!, { limit: 100 }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch applications for a specific job
export function useJobApplications(
  jobId: string,
  options: { page?: number; limit?: number; status?: string } = {}
) {
  return useQuery({
    queryKey: ['applications', 'job', jobId, options],
    queryFn: () => getJobApplications(jobId, options),
    enabled: !!jobId,
  });
}

// Fetch a single application
export function useApplication(id: string) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => getApplication(id).then((res) => res.application),
    enabled: !!id,
  });
}

// Update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: Application['status']; notes?: string }) =>
      updateApplicationStatus(id, { status, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
    },
  });
}

// Get pending applications count (admin)
export function usePendingApplicationsCount() {
  return useQuery({
    queryKey: ['pending-applications-count'],
    queryFn: () => getPendingApplicationsCount(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}
