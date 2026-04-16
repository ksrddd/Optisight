/**
 * Global Auth Middleware
 * Protects all routes except /login and /register
 * Redirects unauthenticated users to /login
 */
export default defineNuxtRouteMiddleware((to) => {
  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register']

  if (publicRoutes.includes(to.path)) {
    return // Allow access to public routes
  }

  // Check for token in cookie (SSR-safe)
  const tokenCookie = useCookie('optisight_token')

  if (!tokenCookie.value) {
    // Not authenticated → redirect to login
    return navigateTo('/login')
  }
})
