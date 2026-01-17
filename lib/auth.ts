const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  contactNumber?: string | null;
  address?: string | null;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  resumeUploadedAt?: string | null;
  roles: string[];
  // Simplified permission level: 'canEdit' (full access) or 'canRead' (view only)
  permissionLevel?: string | null;
}

export interface AuthResponse {
  user: User;
}

// Custom error class to include cooldown information
export class CooldownError extends Error {
  cooldown: number;
  
  constructor(message: string, cooldown: number) {
    super(message);
    this.name = 'CooldownError';
    this.cooldown = cooldown;
  }
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function register(data: RegisterData): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Registration failed');
  }

  return result;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Login failed');
  }

  return result;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    });

    if (!res.ok) {
      return null;
    }

    const result = await res.json();
    return result.user;
  } catch {
    return null;
  }
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Verification failed');
  }

  return result;
}

export async function resendVerificationEmail(email: string): Promise<{ message: string; cooldown?: number }> {
  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const result = await res.json();
  
  if (!res.ok) {
    if (res.status === 429 && result.cooldown) {
      throw new CooldownError(result.error, result.cooldown);
    }
    throw new Error(result.error || 'Failed to resend verification email');
  }

  return result;
}

export async function forgotPassword(email: string): Promise<{ message: string; cooldown?: number }> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const result = await res.json();
  
  if (!res.ok) {
    if (res.status === 429 && result.cooldown) {
      throw new CooldownError(result.error, result.cooldown);
    }
    throw new Error(result.error || 'Request failed');
  }

  return result;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, password }),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Reset failed');
  }

  return result;
}

export async function requestMagicLink(email: string): Promise<{ message: string; cooldown?: number }> {
  const res = await fetch(`${API_URL}/auth/magic-link/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const result = await res.json();
  
  if (!res.ok) {
    if (res.status === 429 && result.cooldown) {
      throw new CooldownError(result.error, result.cooldown);
    }
    throw new Error(result.error || 'Request failed');
  }

  return result;
}

export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/magic-link/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Verification failed');
  }

  return result;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  address?: string;
}

export async function updateProfile(data: UpdateProfileData): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Failed to update profile');
  }

  return result;
}

export async function uploadResume(file: File): Promise<{ message: string; user: User }> {
  const formData = new FormData();
  formData.append('resume', file);

  const res = await fetch(`${API_URL}/auth/me/resume`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Failed to upload resume');
  }

  return result;
}

export async function deleteResume(): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_URL}/auth/me/resume`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Failed to delete resume');
  }

  return result;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/me/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || 'Failed to change password');
  }

  return result;
}
