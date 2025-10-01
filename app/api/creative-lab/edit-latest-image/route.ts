import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthenticatedUser } from "@/lib/auth";
import { CreativeLabService } from "@/lib/services";

const bodySchema = z.object({
  session_id: z.string().min(1),
  prompt: z.string().min(1),
});

export const POST = withAuth(async (request: NextRequest, _user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const validated = bodySchema.parse(body);

    const service = new CreativeLabService();
    const asset = await service.editLatestImageInSession(validated.session_id, validated.prompt);

    if (!asset) {
      return NextResponse.json({ success: false, error: "Failed to edit latest image" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { asset } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});


