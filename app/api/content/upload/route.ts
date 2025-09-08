import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, AuthenticatedUser } from "@/lib/auth";
import { UploadService } from "@/lib/services";

const uploadSchema = z.object({
  is_draft: z.boolean(),
  title: z.string().min(1),
  caption: z.string(),
  disable_duet: z.boolean(),
  disable_stitch: z.boolean(),
  disable_comment: z.boolean(),
  video_cover_timestamp: z.number().int(), // long in milliseconds
  brand_content: z.boolean(),
  brand_organic: z.boolean(),
  is_private: z.boolean(),
  channel: z.string(),
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    // Get form data containing files and other fields
    const formData = await request.formData();
    
    // Extract uploaded files
    const files = formData.getAll('files') as File[];
    
    // Extract other form fields and convert to proper types
    const formFields = {
      is_draft: formData.get('is_draft') === 'true',
      title: formData.get('title') as string,
      caption: formData.get('caption') as string,
      disable_duet: formData.get('disable_duet') === 'true',
      disable_stitch: formData.get('disable_stitch') === 'true',
      disable_comment: formData.get('disable_comment') === 'true',
      video_cover_timestamp: parseInt(formData.get('video_cover_timestamp') as string) || 0,
      brand_content: formData.get('brand_content') === 'true',
      brand_organic: formData.get('brand_organic') === 'true',
      is_private: formData.get('is_private') === 'true',
      channel: formData.get('channel') as string,
    };

    // Validate form fields
    const validated = uploadSchema.parse(formFields);
    
    // Filter out empty files
    const validFiles = files.filter(file => file.size > 0);
    
    if (validFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid files provided" },
        { status: 400 }
      );
    }
    
    // Call upload service with files and validated options
    const uploadOptions = {
      ...validated,
      userId: user.id,
      channelId: validated.channel,
    };
    
    const result = await UploadService.upload(validFiles, uploadOptions);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Upload processed successfully",
        data: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Upload processing failed",
        metadata: result.metadata
      }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process upload request" },
      { status: 500 }
    );
  }
});
