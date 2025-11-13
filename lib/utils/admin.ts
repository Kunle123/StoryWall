/**
 * Admin email addresses that have full access to edit/delete any timeline
 */
const ADMIN_EMAILS = [
  'kunle2000@gmail.com',
];

/**
 * Check if an email address belongs to an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

