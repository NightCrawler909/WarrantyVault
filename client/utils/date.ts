/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get days remaining until a date
 */
export const getDaysRemaining = (date: Date | string): number => {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Check if a warranty is expiring soon (within 30 days)
 */
export const isExpiringSoon = (date: Date | string): boolean => {
  const daysRemaining = getDaysRemaining(date);
  return daysRemaining > 0 && daysRemaining <= 30;
};

/**
 * Check if a warranty has expired
 */
export const isExpired = (date: Date | string): boolean => {
  return getDaysRemaining(date) < 0;
};
