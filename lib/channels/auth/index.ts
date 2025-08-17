export { BaseAuthLinkGenerator, type AuthLinkParams, type AuthLinkResult } from './types';
export { ShopeeAuthLinkGenerator } from './shopee';
export { AuthGeneratorRegistry, AUTH_GENERATORS } from './registry';

import { AuthGeneratorRegistry } from './registry';
import { type AuthLinkParams } from './types';

export function generateChannelAuthLink(channelId: string, params: AuthLinkParams) {
  const generator = AuthGeneratorRegistry.getGenerator(channelId);
  
  if (!generator) {
    throw new Error(`No auth link generator found for channel: ${channelId}`);
  }

  return generator.generateAuthLink(params);
}
