import { NextRequest, NextResponse } from "next/server";
import { ChannelFactory } from "@/lib/channels";

interface RouteParams {
  params: {
    channel: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { channel } = params;
  
  try {
    // Factory handles validation internally - no need to verify channel
    return ChannelFactory.getChannel(channel).callback(request);

  } catch (error) {
    console.error(`Error in ${channel} OAuth callback:`, error);
    
    const errorUrl = new URL('/app/settings', request.url);
    errorUrl.searchParams.set('error', 'callback_error');
    errorUrl.searchParams.set('error_message', `Authentication failed for ${channel}`);
    return NextResponse.redirect(errorUrl);
  }
}
