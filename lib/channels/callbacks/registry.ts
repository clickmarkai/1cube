import { BaseOAuthCallback } from './base';
import { ShopeeOAuthCallback } from './shopee';

const CALLBACK_HANDLERS: Record<string, () => BaseOAuthCallback> = {
  'shopee': () => new ShopeeOAuthCallback(),
};

export class CallbackRegistry {
  
  static getHandler(channelId: string): BaseOAuthCallback | null {
    const handlerFactory = CALLBACK_HANDLERS[channelId];
    return handlerFactory ? handlerFactory() : null;
  }

  static hasHandler(channelId: string): boolean {
    return channelId in CALLBACK_HANDLERS;
  }

  static getSupportedChannels(): string[] {
    return Object.keys(CALLBACK_HANDLERS);
  }

  static registerHandler(channelId: string, handlerFactory: () => BaseOAuthCallback): void {
    CALLBACK_HANDLERS[channelId] = handlerFactory;
  }
}

export { CALLBACK_HANDLERS };
