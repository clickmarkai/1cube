/**
 * Simple Test for Shopee getToken functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChannelFactory } from '../../../lib/channels';

export async function GET(request: NextRequest) {
  try {
    // Get Shopee channel
    const channelInstance = ChannelFactory.getChannel('shopee');
    
    // Create token map with test data
    const tokenMap = new Map<string, string>();
    tokenMap.set('shop_id', '225664136');
    tokenMap.set('code', '6a78454252507a74756a50634b6b7479');
    
    // Call getToken
    const tokens = await channelInstance.getToken(tokenMap);
    
    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      message: 'Shopee getToken test completed'
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
