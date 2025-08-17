export { BaseOAuthCallback, type CallbackParams, type CallbackResult } from './base';
export { ShopeeOAuthCallback } from './shopee';
export { CallbackRegistry, CALLBACK_HANDLERS } from './registry';

import { CallbackRegistry } from './registry';

export async function handleChannelCallback(channelId: string, request: Request) {
  const handler = CallbackRegistry.getHandler(channelId);
  
  if (!handler) {
    throw new Error(`No callback handler found for channel: ${channelId}`);
  }

  return handler.handleCallback(request as any);
}
