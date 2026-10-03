import "server-only";

export type DataLayerErrorCode = "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "DATABASE";

export interface DataLayerErrorOptions {
  details?: unknown;
  cause?: unknown;
}

export class DataLayerError extends Error {
  readonly code: DataLayerErrorCode;
  readonly details: unknown;

  constructor(code: DataLayerErrorCode, message: string, options: DataLayerErrorOptions = {}) {
    super(message);
    this.name = "DataLayerError";
    this.code = code;
    this.details = options.details;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

export class NotFoundError extends DataLayerError {
  constructor(message = "The requested record was not found.", options: DataLayerErrorOptions = {}) {
    super("NOT_FOUND", message, options);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends DataLayerError {
  constructor(message = "The provided input is invalid.", options: DataLayerErrorOptions = {}) {
    super("VALIDATION", message, options);
    this.name = "ValidationError";
  }
}

export class ConflictError extends DataLayerError {
  constructor(message = "The operation conflicts with existing data.", options: DataLayerErrorOptions = {}) {
    super("CONFLICT", message, options);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends DataLayerError {
  constructor(message = "A database error occurred.", options: DataLayerErrorOptions = {}) {
    super("DATABASE", message, options);
    this.name = "DatabaseError";
  }
}

interface PrismaErrorLike {
  code: string;
}

function isPrismaError(error: unknown): error is PrismaErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

/**
 * Normalizes unknown thrown values (Prisma errors, generic Errors) into the
 * typed data-layer error hierarchy so future API/action layers never surface
 * raw Prisma internals to callers.
 */
export function toDataLayerError(error: unknown): DataLayerError {
  if (error instanceof DataLayerError) return error;

  if (isPrismaError(error)) {
    const code = error.code;
    if (code === "P2002") {
      return new ConflictError("A record with the same unique value already exists.", {
        cause: error,
        details: { code },
      });
    }
    if (code === "P2003") {
      return new ConflictError(
        "The operation references a record that does not exist or is still in use.",
        { cause: error, details: { code } },
      );
    }
    if (code === "P2025") {
      return new NotFoundError("The requested record was not found.", {
        cause: error,
        details: { code },
      });
    }
    if (code.startsWith("P100")) {
      return new DatabaseError("The database connection is unavailable.", {
        cause: error,
        details: { code },
      });
    }
    return new DatabaseError("The database operation failed.", { cause: error, details: { code } });
  }

  if (error instanceof Error) {
    return new DatabaseError(error.message || "An unexpected database error occurred.", {
      cause: error,
    });
  }

  return new DatabaseError("An unexpected error occurred while accessing data.", {
    cause: error instanceof Error ? error : undefined,
  });
}