export type ExpiryStatus = 'fresh' | 'near-expiry' | 'expired';

export function getDaysRemaining(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDateStr: string): ExpiryStatus {
  const days = getDaysRemaining(expiryDateStr);
  if (days < 0) return 'expired';
  if (days <= 3) return 'near-expiry';
  return 'fresh';
}

export function getExpiryColorClass(status: ExpiryStatus): string {
  switch (status) {
    case 'expired': return 'text-danger bg-danger/10 border-danger/20';
    case 'near-expiry': return 'text-warning bg-warning/10 border-warning/20';
    case 'fresh': return 'text-success bg-success/10 border-success/20';
  }
}