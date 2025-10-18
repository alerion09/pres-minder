import { z } from "zod";

/**
 * Common validation schemas used across API endpoints
 */

/**
 * Zod schema for URL parameter :id
 * Ensures id is a positive integer
 *
 * Used in:
 * - GET /api/ideas/:id
 * - PUT /api/ideas/:id
 * - DELETE /api/ideas/:id (future)
 */
export const idParamSchema = z.coerce.number().int("ID must be an integer").positive("ID must be positive");
