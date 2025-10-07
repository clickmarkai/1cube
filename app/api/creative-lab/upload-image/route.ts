import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthenticatedUser } from "@/lib/auth";
import { CreativeLabService } from "@/lib/services";

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const formData = await request.formData();

    const sessionId = formData.get('session_id');
    const file = formData.get('file');
    const channel = formData.get('channel');

    const parse = z.object({
      session_id: z.string().min(1),
      file: z.any(),
      channel: z.string().optional(),
    }).safeParse({
      session_id: typeof sessionId === 'string' ? sessionId : '',
      file,
      channel: typeof channel === 'string' ? channel : undefined,
    });

    if (!parse.success) {
      return NextResponse.json({ success: false, errors: parse.error.errors }, { status: 400 });
    }

    if (!(parse.data.file instanceof File)) {
      return NextResponse.json({ success: false, error: "Invalid or missing file" }, { status: 400 });
    }

    const service = new CreativeLabService();
    const asset = await service.uploadImageToSession(parse.data.session_id, parse.data.file, {
      userId: user.id,
      channel: parse.data.channel,
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { asset } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});


