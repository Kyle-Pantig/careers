import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIndustries,
  getAdminIndustries,
  getIndustry,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  toggleIndustryStatus,
  type Industry,
  type CreateIndustryData,
} from '@/lib/industries';

// Query keys
export const industryKeys = {
  all: ['industries'] as const,
  lists: () => [...industryKeys.all, 'list'] as const,
  list: (filters: string) => [...industryKeys.lists(), { filters }] as const,
  admin: () => [...industryKeys.all, 'admin'] as const,
  details: () => [...industryKeys.all, 'detail'] as const,
  detail: (id: string) => [...industryKeys.details(), id] as const,
};

// Get all active industries (public)
export function useIndustries() {
  return useQuery({
    queryKey: industryKeys.lists(),
    queryFn: async () => {
      const result = await getIndustries();
      return result.industries ?? [];
    },
  });
}

// Get all industries (admin)
export function useAdminIndustries() {
  return useQuery({
    queryKey: industryKeys.admin(),
    queryFn: async () => {
      const result = await getAdminIndustries();
      return result.industries ?? [];
    },
  });
}

// Get single industry
export function useIndustry(id: string) {
  return useQuery({
    queryKey: industryKeys.detail(id),
    queryFn: async () => {
      const result = await getIndustry(id);
      return result.industry;
    },
    enabled: !!id,
  });
}

// Create industry mutation
export function useCreateIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIndustryData) => createIndustry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: industryKeys.all });
    },
  });
}

// Update industry mutation
export function useUpdateIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateIndustryData }) =>
      updateIndustry(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: industryKeys.all });
      queryClient.invalidateQueries({ queryKey: industryKeys.detail(variables.id) });
    },
  });
}

// Delete industry mutation
export function useDeleteIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: industryKeys.all });
    },
  });
}

// Toggle industry status mutation
export function useToggleIndustryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleIndustryStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: industryKeys.all });
    },
  });
}
