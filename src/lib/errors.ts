/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Build standard error response object
 */
export function errorResponse(message: string, details?: unknown) {
	return {
		error: message,
		...(details && { details: getErrorMessage(details) }),
	};
}
