import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJobs,
  getAdminJobs,
  getJob,
  getJobByNumber,
  getJobByNumberAdmin,
  createJob,
  updateJob,
  deleteJob,
  toggleJobPublish,
  type Job,
  type CreateJobData,
  type JobFilters,
} from '@/lib/jobs';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  admin: () => [...jobKeys.all, 'admin'] as const,
  adminList: (filters: JobFilters) => [...jobKeys.admin(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  byNumber: (jobNumber: string) => [...jobKeys.all, 'byNumber', jobNumber] as const,
};

// Get all published jobs (public)
export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: async () => {
      const result = await getJobs(filters);
      return result;
    },
  });
}

// Get all jobs (admin)
export function useAdminJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: jobKeys.adminList(filters),
    queryFn: async () => {
      const result = await getAdminJobs(filters);
      return result;
    },
  });
}

// Get single job by ID
export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: async () => {
      const result = await getJob(id);
      return result.job;
    },
    enabled: !!id,
  });
}

// Get single job by job number (public - only published)
export function useJobByNumber(jobNumber: string) {
  return useQuery({
    queryKey: jobKeys.byNumber(jobNumber),
    queryFn: async () => {
      const result = await getJobByNumber(jobNumber);
      return result.job;
    },
    enabled: !!jobNumber,
  });
}

// Get single job by job number (admin - includes unpublished)
export function useJobByNumberAdmin(jobNumber: string) {
  return useQuery({
    queryKey: [...jobKeys.byNumber(jobNumber), 'admin'],
    queryFn: async () => {
      const result = await getJobByNumberAdmin(jobNumber);
      return result.job;
    },
    enabled: !!jobNumber,
  });
}

// Create job mutation
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobData) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

// Update job mutation
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateJobData }) =>
      updateJob(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
    },
  });
}

// Delete job mutation
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

// Toggle job publish status mutation
export function useToggleJobPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleJobPublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
