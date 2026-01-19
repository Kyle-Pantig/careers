const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface EmailTemplatePlaceholder {
  name: string;
  description: string;
}

export interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplatesResponse {
  templates: EmailTemplate[];
  placeholders: Record<string, EmailTemplatePlaceholder[]>;
}

export interface EmailTemplateResponse {
  template: EmailTemplate;
  placeholders: EmailTemplatePlaceholder[];
}

// Get all email templates (admin only)
export async function getEmailTemplates(): Promise<EmailTemplatesResponse> {
  const res = await fetch(`${API_URL}/email-templates`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch email templates');
  }

  return result;
}

// Get single email template by type (admin only)
export async function getEmailTemplate(type: string): Promise<EmailTemplateResponse> {
  const res = await fetch(`${API_URL}/email-templates/${type}`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch email template');
  }

  return result;
}

// Update email template (admin only)
export interface UpdateEmailTemplateData {
  subject?: string;
  body?: string;
  isActive?: boolean;
}

export async function updateEmailTemplate(
  id: string,
  data: UpdateEmailTemplateData
): Promise<{ success: boolean; message: string; template: EmailTemplate }> {
  const res = await fetch(`${API_URL}/email-templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to update email template');
  }

  return result;
}

// Toggle email template active status (admin only)
export async function toggleEmailTemplate(
  id: string
): Promise<{ success: boolean; message: string; template: EmailTemplate }> {
  const res = await fetch(`${API_URL}/email-templates/${id}/toggle`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to toggle email template');
  }

  return result;
}

// Reset email template to default (admin only)
export async function resetEmailTemplate(
  id: string
): Promise<{ success: boolean; message: string; template: EmailTemplate }> {
  const res = await fetch(`${API_URL}/email-templates/${id}/reset`, {
    method: 'POST',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to reset email template');
  }

  return result;
}
