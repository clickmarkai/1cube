import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthenticatedUser } from "@/lib/auth";
import { CreativeLabService } from "@/lib/services";

const bodySchema = z.object({
  asset: z.string().url(),
  asset_type: z.string().min(1),
  prompt: z.string().optional().nullable(),
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const validated = bodySchema.parse(body);

    const service = new CreativeLabService();
    const result = await service.createSessionAndAddAsset(user.id, {
      asset: validated.asset,
      asset_type: validated.asset_type,
      prompt: validated.prompt ?? null,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "Failed to create session with asset" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});


