/**
 * Central runtime configuration.
 *
 * The JWT secret lives here and nowhere else — previously it was duplicated as a
 * hard-coded literal in both the auth route and the middleware (SEC-AUTH-001),
 * which meant anyone who read the source could forge an admin token. There is no
 * fallback: the process refuses to start without a real secret, so a missing env
 * var fails loudly at boot rather than silently signing tokens with a public
 * constant.
 */

// Load .env before any value is read. index.ts did not previously load dotenv,
// so process.env was empty at runtime and the code fell back to the hard-coded
// secret. Loading here means every consumer of `config` sees real values.
import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[config] ${name} is required but was not set. Refusing to start. ` +
        `Set it in the environment (see backend/.env.example).`
    );
  }
  return value;
}

const JWT_SECRET = required('JWT_SECRET');

// A short secret is as good as none. Reject anything an attacker could brute
// force, so a placeholder value cannot slip into a deployed environment.
if (JWT_SECRET.length < 32) {
  throw new Error(
    '[config] JWT_SECRET must be at least 32 characters. Generate one with ' +
      '`node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"`.'
  );
}

/**
 * Origins allowed to call the API and open a socket. Wildcard CORS
 * (SEC-CONF-001) is replaced by an explicit allowlist; set CORS_ORIGINS as a
 * comma-separated list in production. Defaults to the local Nuxt dev origin.
 */
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const config = {
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: '1d' as const,
  corsOrigins: CORS_ORIGINS,
  port: Number(process.env.PORT) || 3001,
  isProduction: process.env.NODE_ENV === 'production'
};
