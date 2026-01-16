const COOLDOWN_DURATION = 60 * 1000; // 60 seconds in milliseconds

type CooldownType = 'magic-link' | 'forgot-password' | 'verify-email';

function getStorageKey(type: CooldownType, email: string): string {
  return `cooldown:${type}:${email.toLowerCase()}`;
}

export function setCooldown(type: CooldownType, email: string): void {
  if (typeof window === 'undefined') return;
  
  const key = getStorageKey(type, email);
  const expiresAt = Date.now() + COOLDOWN_DURATION;
  localStorage.setItem(key, expiresAt.toString());
}

export function getCooldownRemaining(type: CooldownType, email: string): number {
  if (typeof window === 'undefined') return 0;
  
  const key = getStorageKey(type, email);
  const expiresAt = localStorage.getItem(key);
  
  if (!expiresAt) return 0;
  
  const remaining = parseInt(expiresAt, 10) - Date.now();
  
  if (remaining <= 0) {
    localStorage.removeItem(key);
    return 0;
  }
  
  return Math.ceil(remaining / 1000); // Return seconds
}

export function clearCooldown(type: CooldownType, email: string): void {
  if (typeof window === 'undefined') return;
  
  const key = getStorageKey(type, email);
  localStorage.removeItem(key);
}

export function isOnCooldown(type: CooldownType, email: string): boolean {
  return getCooldownRemaining(type, email) > 0;
}
