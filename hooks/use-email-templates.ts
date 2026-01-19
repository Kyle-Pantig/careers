import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  toggleEmailTemplate,
  resetEmailTemplate,
  type UpdateEmailTemplateData,
} from '@/lib/email-templates';

export const emailTemplateKeys = {
  all: ['email-templates'] as const,
  detail: (type: string) => ['email-templates', type] as const,
};

// Get all email templates
export function useEmailTemplates() {
  return useQuery({
    queryKey: emailTemplateKeys.all,
    queryFn: getEmailTemplates,
  });
}

// Get single email template by type
export function useEmailTemplate(type: string) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(type),
    queryFn: () => getEmailTemplate(type),
    enabled: !!type,
  });
}

// Update email template
export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailTemplateData }) =>
      updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });
}

// Toggle email template active status
export function useToggleEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });
}

// Reset email template to default
export function useResetEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resetEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });
}
