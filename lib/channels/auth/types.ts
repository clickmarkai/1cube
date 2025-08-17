export interface AuthLinkResult {
  authLink: string;
  state: string;
}

export interface AuthLinkParams {
  userId: string;
  redirectUri?: string;
  scopes?: string[];
  additionalParams?: Record<string, string>;
}

export abstract class BaseAuthLinkGenerator {
  protected channelId: string;

  constructor(channelId: string) {
    this.channelId = channelId;
  }

  abstract generateAuthLink(params: AuthLinkParams): AuthLinkResult;

  protected generateState(userId: string): string {
    const crypto = require('crypto');
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${randomPart}.${userId}`;
  }

  protected getRedirectUri(customRedirectUri?: string): string {
    if (customRedirectUri) {
      return customRedirectUri;
    }

    const { ChannelRegistry } = require('../registry');
    const authConfig = ChannelRegistry.getAuthConfig(this.channelId);
    return authConfig?.redirectUrl || `${process.env.BASE_URL || 'http://localhost:3000'}/api/callback/auth/${this.channelId}`;
  }
}
