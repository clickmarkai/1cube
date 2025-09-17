export const FACEBOOK_HOSTS = {
  NORMAL: 'https://www.facebook.com',
  API: 'https://api.facebook.com',
  GRAPH: 'https://graph.facebook.com'
} as const;

export interface FacebookConfig {
  clientId: string;
  clientSecret: string;
}

export class FacebookApiClient {
  private config: FacebookConfig;

  constructor(config: FacebookConfig) {
    this.config = config;
  }

  async getToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in?: number;
  }> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: redirectUri,
        client_secret: this.config.clientSecret,
        code: code
      });

      const response = await fetch(`${FACEBOOK_HOSTS.GRAPH}/v23.0/oauth/access_token?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Facebook token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook token error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Facebook token request failed:', error);
      throw error;
    }
  }

  generateAuthUrl(redirectUri: string, state: string, scope?: string[]): string {
    const defaultScopes = [
      'email',
      'public_profile'
    ];

    const scopes = scope || defaultScopes;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(','),
      state: state
    });

    return `${FACEBOOK_HOSTS.NORMAL}/v23.0/dialog/oauth?${params.toString()}`;
  }
}
