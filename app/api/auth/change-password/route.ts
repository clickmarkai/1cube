import { NextResponse } from "next/server";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    // Mock password validation - in production, you'd verify against database
    // For demo purposes, let's assume current password should be "demo123"
    if (validated.currentPassword !== "demo123") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Current password is incorrect" 
        },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Hash the new password
    // 2. Update the database
    // 3. Invalidate existing sessions if needed
    
    // Mock successful password change
    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
      data: {
        updatedAt: new Date(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed",
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    console.error("Password change error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to change password" 
      },
      { status: 500 }
    );
  }
}
