import { 
  ChannelDefinition, 
  AuthType, 
  ChannelAuthConfig 
} from './types';

export const CHANNEL_REGISTRY: ChannelDefinition[] = [
  {
    id: 1,
    name: 'shopee',
    icon: '🛍️',
    description: 'Southeast Asia and Taiwan online marketplace',  
    authType: AuthType.OAUTH,
    requiredCredentials: ['shopId', 'apiKey'],
    optionalCredentials: ['apiSecret']
  },
  {
    id: 2,
    name: 'Tokopedia',
    icon: '🟢',
    description: 'Indonesian e-commerce marketplace',
    authType: AuthType.API_KEY,
    requiredCredentials: ['apiKey', 'apiSecret']
  },
  {
    id: 3,
    name: 'Lazada',
    icon: '🔵',
    description: 'Southeast Asia e-commerce platform',
    authType: AuthType.API_KEY,
    requiredCredentials: ['apiKey', 'apiSecret']
  },
  {
    id: 4,
    name: 'Bukalapak',
    icon: '🔴',
    description: 'Indonesian online marketplace',
    authType: AuthType.API_KEY,
    requiredCredentials: ['apiKey', 'apiSecret']
  },
  {
    id: 5,
    name: 'Blibli',
    icon: '🟦',
    description: 'Indonesian e-commerce marketplace',
    authType: AuthType.API_KEY,
    requiredCredentials: ['apiKey', 'apiSecret']
  }
];

export const CHANNEL_AUTH_CONFIGS: Record<string, ChannelAuthConfig> = {
  'shopee': {
    authUrl: 'https://openplatform.sandbox.test-stable.shopee.sg/api/v2/shop/auth_partner',
    clientId: process.env.SHOPEE_PARTNER_ID,
    clientSecret: process.env.SHOPEE_PARTNER_KEY,
    redirectUrl: process.env.SHOPEE_REDIRECT_URI || 'https://1cube.netlify.app/api/callback/auth/shopee',
    scopes: ['item.base', 'order.base', 'shop.base']
  }
};

export class ChannelRegistry {
  
  static getAllChannels(): ChannelDefinition[] {
    return [...CHANNEL_REGISTRY];
  }

  static getChannelsByAuthType(authType: AuthType): ChannelDefinition[] {
    return CHANNEL_REGISTRY.filter(channel => channel.authType === authType);
  }

  static getChannelDefinition(channelId: number): ChannelDefinition | undefined {
    return CHANNEL_REGISTRY.find(channel => channel.id === channelId);
  }

  static getChannelDefinitionByName(channelName: string): ChannelDefinition | undefined {
    return CHANNEL_REGISTRY.find(channel => channel.name === channelName);
  }

  static getAuthConfig(channelName: string): ChannelAuthConfig | undefined {
    return CHANNEL_AUTH_CONFIGS[channelName];
  }

  static isOAuthChannel(channelName: string): boolean {
    const channel = this.getChannelDefinitionByName(channelName);
    return channel?.authType === AuthType.OAUTH;
  }

  static getOAuthChannels(): ChannelDefinition[] {
    return this.getChannelsByAuthType(AuthType.OAUTH);
  }

  static getApiKeyChannels(): ChannelDefinition[] {
    return this.getChannelsByAuthType(AuthType.API_KEY);
  }

  static validateCredentials(channelName: string, credentials: any): { valid: boolean; missing: string[] } {
    const channel = this.getChannelDefinitionByName(channelName);
    if (!channel) {
      return { valid: false, missing: ['Invalid channel'] };
    }

    const missing: string[] = [];
    
    channel.requiredCredentials.forEach(field => {
      if (!credentials[field]) {
        missing.push(field);
      }
    });

    return {
      valid: missing.length === 0,
      missing
    };
  }
}
