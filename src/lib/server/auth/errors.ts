import "server-only";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "SESSION_EXPIRED"
  | "AUTH_ERROR";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

/**
 * Generic authentication failure. The message is intentionally identical for
 * unknown email, wrong password, and inactive account so callers cannot leak
 * which part of the credential was wrong (no account enumeration).
 */
export class InvalidCredentialsError extends AuthError {
  constructor(options: { cause?: unknown } = {}) {
    super("INVALID_CREDENTIALS", "Invalid credentials.", options);
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthenticatedError extends AuthError {
  constructor(message = "Authentication is required to access this resource.") {
    super("UNAUTHENTICATED", message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(
    message = "You do not have permission to access this resource.",
  ) {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

/** Returns true for errors that are safe to surface as generic login failures. */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
