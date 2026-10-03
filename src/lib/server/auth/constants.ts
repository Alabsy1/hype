// Phase 06 authentication constants. Single source of truth for session
// lifetime, cookie configuration, and password policy — nothing auth-related
// hardcodes durations, names, or limits elsewhere.

/** Name of the HttpOnly session cookie (single login for the whole site). */
export const SESSION_COOKIE_NAME = "hype_session";

/** Session lifetime in days. Sessions are fixed-duration (no rotation). */
export const SESSION_MAX_AGE_DAYS = 7;

/** Session lifetime in seconds (cookie `maxAge`) and milliseconds. */
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/** Minimum password length. Deliberately reasonable, not punitive. */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * Maximum password length. bcrypt (and bcryptjs) only process the first 72
 * bytes of input, so longer passwords would be silently truncated — reject
 * them instead of hashing a prefix the user did not intend.
 */
export const PASSWORD_MAX_LENGTH = 72;

/** bcrypt cost factor. 12 ≈ a few hundred ms per hash on modern hardware. */
export const BCRYPT_COST_FACTOR = 12;
