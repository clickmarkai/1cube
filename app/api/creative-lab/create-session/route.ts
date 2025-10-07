import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthenticatedUser } from "@/lib/auth";
import { CreativeLabService } from "@/lib/services";

const bodySchema = z.object({});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    // Validate body (currently empty schema for future extensibility)
    const _ = bodySchema.safeParse(await request.json().catch(() => ({})));

    const service = new CreativeLabService();
    const session = await service.createSession(user.id);

    if (!session) {
      return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { session } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});


