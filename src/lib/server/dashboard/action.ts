import "server-only";

import {
  ConflictError,
  DataLayerError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors/data-layer-error";

/**
 * Standard Server Action result for dashboard mutations. `useActionState`
 * forms render `error`; success paths redirect or revalidate instead of
 * returning data.
 */
export interface ActionState {
  ok: boolean;
  error: string | null;
}

export function actionOk(): ActionState {
  return { ok: true, error: null };
}

export function actionFail(error: string): ActionState {
  return { ok: false, error };
}

interface ZodIssueLike {
  message?: unknown;
}

function firstIssueMessage(details: unknown): string | null {
  if (!Array.isArray(details) || details.length === 0) return null;
  const message = (details[0] as ZodIssueLike)?.message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

/**
 * Maps data-layer failures to human-readable admin messages. Never exposes
 * Prisma codes, SQL, or stack traces. Database-connection failures surface a
 * clear "not configured" message (DATABASE_URL may be absent).
 */
export function toActionState(error: unknown): ActionState {
  if (error instanceof ValidationError) {
    return actionFail(firstIssueMessage(error.details) ?? error.message);
  }
  if (error instanceof ConflictError) {
    return actionFail(
      "A record with the same unique value already exists. Check the slug and try again.",
    );
  }
  if (error instanceof NotFoundError) {
    return actionFail("The requested record was not found. It may have been removed.");
  }
  if (error instanceof DataLayerError) {
    return actionFail(error.message);
  }
  if (error instanceof Error) {
    return actionFail("Something went wrong. Please try again.");
  }
  return actionFail("Something went wrong. Please try again.");
}
