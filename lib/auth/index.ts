/**
 * Authentication module exports
 * Centralized exports for all authentication-related utilities
 */

// Core authentication utilities
export {
  validateSession,
  requireAuth,
  type AuthenticatedUser,
} from "./auth-utils";

// API middleware for protecting routes
export {
  withAuth,
  withOptionalAuth,
  withRole,
} from "@/lib/middleware/api-middleware";

// Client-side authentication utilities
export {
  authenticatedFetch,
} from "./client-auth";
