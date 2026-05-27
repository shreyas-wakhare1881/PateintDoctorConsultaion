
import { redirect } from 'next/navigation';

/**
 * Legacy /login route — redirects to canonical /patient/login.
 * Kept for backwards compatibility with any bookmarks or external links.
 */
export default function LegacyLoginRedirect() {
  redirect('/patient/login');
}
