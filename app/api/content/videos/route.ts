import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedUser } from "@/lib/auth";
import { ChannelFactory } from "@/lib/channels/factory/channels";
import { TikTokChannel } from "@/lib/channels/tiktok-channel";

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    console.log(`🔍 Testing getAllVideos for user: ${user.id}`);
    
    // Get TikTok channel instance
    const tikTokChannel = ChannelFactory.getChannel('tiktok') as TikTokChannel;
    
    if (!tikTokChannel) {
      return NextResponse.json({
        success: false,
        error: "TikTok channel not available"
      }, { status: 500 });
    }

    // Call getAllVideos method
    const result = await tikTokChannel.getAllVideos(user.id);
    
    // Return the result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully fetched ${result.totalCount} videos across ${result.pageCount} pages`,
        data: {
          videos: result.videos,
          totalCount: result.totalCount,
          pageCount: result.pageCount,
          platform: result.platform,
          note: result.note,
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        data: {
          videos: result.videos,
          totalCount: result.totalCount || 0,
          platform: result.platform,
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error("❌ TikTok getAllVideos test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      userId: user.id,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});

// Also support POST for testing with optional parameters
export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json().catch(() => ({}));
    console.log(`🔍 Testing getAllVideos for user: ${user.id} with options:`, body);
    
    // Get TikTok channel instance
    const tikTokChannel = ChannelFactory.getChannel('tiktok') as TikTokChannel;
    
    if (!tikTokChannel) {
      return NextResponse.json({
        success: false,
        error: "TikTok channel not available"
      }, { status: 500 });
    }

    // Call getAllVideos method
    const result = await tikTokChannel.getAllVideos(user.id);
    
    // Return the result with additional debug info
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully fetched ${result.totalCount} videos across ${result.pageCount} pages`,
        data: {
          videos: result.videos,
          totalCount: result.totalCount,
          pageCount: result.pageCount,
          platform: result.platform,
          note: result.note,
          userId: user.id,
          timestamp: new Date().toISOString(),
          requestBody: body,
          videoSample: result.videos.slice(0, 3) // Include first 3 videos as sample
        },
        debug: {
          hasVideos: result.videos.length > 0,
          firstVideoId: result.videos[0]?.id,
          lastVideoId: result.videos[result.videos.length - 1]?.id,
          uniqueVideoIds: [...new Set(result.videos.map((v: any) => v.id))].length
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        data: {
          videos: result.videos,
          totalCount: result.totalCount || 0,
          platform: result.platform,
          userId: user.id,
          timestamp: new Date().toISOString(),
          requestBody: body
        }
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error("❌ TikTok getAllVideos test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      userId: user.id,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});
