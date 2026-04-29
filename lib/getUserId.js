export function getUserIdFromRequest(req) {
  // Temporary fallback until auth is wired in.
  // Replace later with Clerk / Supabase Auth / NextAuth user id.
  return req.headers.get('x-user-id') || 'demo-user';
}