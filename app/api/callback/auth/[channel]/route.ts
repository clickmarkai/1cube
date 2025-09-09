import { NextRequest, NextResponse } from "next/server";
import { ChannelFactory } from "@/lib/channels/factory/channels";

interface RouteParams {
  params: Promise<{
    channel: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { channel } = await params;
  
  try {
    const channelInstance = ChannelFactory.getChannel(channel);
    if (!channelInstance) {
      throw new Error(`Unsupported channel: ${channel}`);
    }
    
    return channelInstance.callback(request);

  } catch (error) {
    console.error(`Error in ${channel} OAuth callback:`, error);
    
    const errorUrl = new URL('/app/settings', request.url);
    errorUrl.searchParams.set('error', 'callback_error');
    errorUrl.searchParams.set('error_message', `Authentication failed for ${channel}`);
    return NextResponse.redirect(errorUrl);
  }
}
