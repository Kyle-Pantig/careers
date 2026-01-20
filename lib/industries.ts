const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET_TOKEN || '';

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    jobs: number;
  };
}

export interface CreateIndustryData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateIndustryData extends CreateIndustryData {
  id: string;
}

// Get all active industries (public)
export async function getIndustries(): Promise<{ industries: Industry[] }> {
  const res = await fetch(`${API_URL}/industries`, {
    credentials: 'include',
    headers: {
      'x-api-secret': API_SECRET,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch industries');
  }

  return res.json();
}

// Get all industries (admin - includes inactive)
export async function getAdminIndustries(): Promise<{ industries: Industry[] }> {
  const res = await fetch(`${API_URL}/industries/admin`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch industries');
  }

  return res.json();
}

// Get single industry
export async function getIndustry(id: string): Promise<{ industry: Industry }> {
  const res = await fetch(`${API_URL}/industries/${id}`, {
    credentials: 'include',
    headers: {
      'x-api-secret': API_SECRET,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to fetch industry');
  }

  return result;
}

// Create industry
export async function createIndustry(data: CreateIndustryData): Promise<{ industry: Industry; message: string }> {
  const res = await fetch(`${API_URL}/industries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to create industry');
  }

  return result;
}

// Update industry
export async function updateIndustry(id: string, data: CreateIndustryData): Promise<{ industry: Industry; message: string }> {
  const res = await fetch(`${API_URL}/industries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to update industry');
  }

  return result;
}

// Delete industry
export async function deleteIndustry(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/industries/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to delete industry');
  }

  return result;
}

// Toggle active status
export async function toggleIndustryStatus(id: string): Promise<{ industry: Industry; message: string }> {
  const res = await fetch(`${API_URL}/industries/${id}/toggle`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Failed to toggle industry status');
  }

  return result;
}
