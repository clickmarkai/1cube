import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "../auth.config";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Validates user session using NextAuth cookies
 * Works automatically with NextAuth session cookies
 */
export async function validateSession(request: NextRequest): Promise<{
  valid: boolean;
  user?: AuthenticatedUser;
  error?: string;
}> {
  try {
    // This method works with cookies set by NextAuth
    const token = await getToken({
      req: request,
      secret: authOptions.secret,
    });

    if (!token) {
      return {
        valid: false,
        error: "No valid session found"
      };
    }

    const user: AuthenticatedUser = {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
    };

    return {
      valid: true,
      user
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return {
      valid: false,
      error: "Session validation failed"
    };
  }
}

/**
 * Middleware function that can be used to protect API routes
 */
export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await validateSession(request);
    
    if (!auth.valid || !auth.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: auth.error || "Authentication required" 
        }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return handler(request, auth.user);
  };
}
