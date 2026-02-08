/**
 * Domain slug validation and generation utility
 * Ensures deployment domain names meet platform requirements:
 * - 5-50 characters
 * - Only lowercase letters, numbers, and hyphens
 * - No spaces or special characters
 */

export function validateDomainSlug(slug: string): boolean {
  const pattern = /^[a-z0-9-]{5,50}$/;
  return pattern.test(slug);
}

export function generateDomainSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50); // Ensure max length
}

// Pre-validated domain slug for this app
export const APP_DOMAIN_SLUG = 'yug-trading-journal-app';
