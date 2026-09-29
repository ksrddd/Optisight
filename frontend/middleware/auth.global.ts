/**
 * Global route guard (FN-02).
 *
 * Every route except the public auth pages requires a session token. This is a
 * UX affordance — it sends a signed-out user to /login instead of rendering an
 * empty authenticated shell — and NOT a security boundary: the real control is
 * server-side authorization on the API (SEC-AUTHZ-001). Do not rely on this to
 * protect data; rely on it to route people sensibly.
 *
 * Runs on server and client, so a deep link to a protected route redirects
 * before the page renders rather than flashing it first.
 */
const PUBLIC_ROUTES = new Set(['/login', '/register'])

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('optisight_token')

  // Signed-in users have no reason to see the auth pages.
  if (token.value && PUBLIC_ROUTES.has(to.path)) {
    return navigateTo('/')
  }

  if (!token.value && !PUBLIC_ROUTES.has(to.path)) {
    // Preserve the intended destination so login can return them to it.
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }
})
