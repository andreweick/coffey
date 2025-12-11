import { z } from "zod";

/**
 * Standard error response schema
 */
export const ErrorResponseSchema = z.object({
	error: z.string().describe("Error message"),
	details: z.any().optional().describe("Additional error details"),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Common OpenAPI response builders for Chanfana endpoints
 */
export const responses = {
	badRequest: (description = "Invalid request") => ({
		description,
		content: {
			"application/json": {
				schema: ErrorResponseSchema,
			},
		},
	}),

	unauthorized: (description = "Unauthorized - missing or invalid authentication") => ({
		description,
		content: {
			"application/json": {
				schema: ErrorResponseSchema,
			},
		},
	}),

	notFound: (description = "Resource not found") => ({
		description,
		content: {
			"application/json": {
				schema: ErrorResponseSchema,
			},
		},
	}),

	internalServerError: (description = "Internal server error") => ({
		description,
		content: {
			"application/json": {
				schema: ErrorResponseSchema,
			},
		},
	}),
};

/**
 * Common response sets for standard endpoints
 */
export const standardErrorResponses = {
	"401": responses.unauthorized(),
	"500": responses.internalServerError(),
};

/**
 * Common response sets for admin-protected endpoints
 */
export const adminErrorResponses = {
	"401": responses.unauthorized("Unauthorized - admin authentication required"),
	"500": responses.internalServerError(),
};
