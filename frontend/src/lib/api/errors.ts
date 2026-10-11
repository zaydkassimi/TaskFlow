import { ApiError } from "./http";

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  return fallback;
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.fieldErrors) {
    return error.fieldErrors;
  }
  return {};
}

export function firstFieldError(
  error: unknown,
  field: string,
): string | undefined {
  return fieldErrors(error)[field];
}