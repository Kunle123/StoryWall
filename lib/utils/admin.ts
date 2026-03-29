/**
 * Admin email addresses: timeline edit/delete override + **admin API routes**
 * (`requireAdmin` in `lib/api/routeAuth.ts` — e.g. `/api/admin/timelines/delete-incomplete`,
 * `/api/admin/events/update-images`). Add addresses here for additional operators.
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

