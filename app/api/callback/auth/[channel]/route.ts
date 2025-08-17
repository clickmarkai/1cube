import { NextRequest, NextResponse } from "next/server";
import { CallbackRegistry } from "@/lib/channels/callbacks";

interface RouteParams {
  params: {
    channel: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { channel } = params;

  try {
    const handler = CallbackRegistry.getHandler(channel);
    
    if (!handler) {
      console.error(`No callback handler found for channel: ${channel}`);
      
      const errorUrl = new URL('/app/settings', request.url);
      errorUrl.searchParams.set('error', 'unsupported_channel');
      errorUrl.searchParams.set('error_message', `Channel ${channel} is not supported`);
      return NextResponse.redirect(errorUrl);
    }

    return handler.handleCallback(request);

  } catch (error) {
    console.error(`Error in ${channel} OAuth callback:`, error);
    
    const errorUrl = new URL('/app/settings', request.url);
    errorUrl.searchParams.set('error', 'callback_error');
    errorUrl.searchParams.set('error_message', `Authentication failed for ${channel}`);
    return NextResponse.redirect(errorUrl);
  }
}
