import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, AuthenticatedUser } from "@/lib/auth";

const imageGenerateSchema = z.object({
  prompt: z.string().min(1),
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const formData = await request.formData();

    const image = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string | null;

    if (!image || image.size === 0) {
      return NextResponse.json(
        { success: false, error: "No valid image provided" },
        { status: 400 }
      );
    }

    const validated = imageGenerateSchema.parse({ prompt: prompt || "" });

    // Placeholder response to mirror structure; actual generation logic to be implemented later
    return NextResponse.json({
      success: true,
      message: "Image generation request received",
      data: {
        prompt: validated.prompt,
        filename: image.name,
        size: image.size,
        userId: user.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Image generate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process image generation request" },
      { status: 500 }
    );
  }
});



