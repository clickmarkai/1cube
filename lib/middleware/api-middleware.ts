import { NextRequest, NextResponse } from "next/server";
import { validateSession, AuthenticatedUser } from "@/lib/auth/auth-utils";

/**
 * Higher-order function that creates authenticated API endpoints
 * Usage: export const POST = withAuth(async (request, user) => { ... });
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Validate session
      const auth = await validateSession(request);
      
      if (!auth.valid || !auth.user) {
        return NextResponse.json(
          { success: false, error: auth.error || "Authentication required" },
          { status: 401 }
        );
      }

      // Call the original handler with the authenticated user
      return await handler(request, auth.user, ...args);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware that adds optional authentication
 * User will be null if not authenticated, but request continues
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser | null, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const auth = await validateSession(request);
      const user = auth.valid ? auth.user! : null;
      
      return await handler(request, user, ...args);
    } catch (error) {
      console.error("Optional auth middleware error:", error);
      return await handler(request, null, ...args);
    }
  };
}

/**
 * Role-based authentication middleware (for future expansion)
 */
export function withRole<T extends any[]>(
  requiredRole: string,
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, ...args: T) => {
    // TODO: Add role checking logic here when you implement user roles
    // For now, all authenticated users have access
    
    return await handler(request, user, ...args);
  });
}
