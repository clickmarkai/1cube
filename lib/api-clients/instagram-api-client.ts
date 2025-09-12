export const INSTAGRAM_HOSTS = {
  NORMAL: 'https://www.instagram.com',
  API: 'https://api.instagram.com',
  GRAPH: 'https://graph.instagram.com'
} as const;

export interface InstagramConfig {
  clientId: string;
  clientSecret: string;
}

export class InstagramApiClient {
  private config: InstagramConfig;

  constructor(config: InstagramConfig) {
    this.config = config;
  }

  async getToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    user_id: string;
    permissions: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('client_id', this.config.clientId);
      formData.append('client_secret', this.config.clientSecret);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);

      const response = await fetch(`${INSTAGRAM_HOSTS.API}/oauth/access_token`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Instagram token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram token error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Instagram token request failed:', error);
      throw error;
    }
  }

  async getLongLivedToken(accessToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.config.clientSecret,
        access_token: accessToken
      });

      const response = await fetch(`${INSTAGRAM_HOSTS.GRAPH}/access_token?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Instagram long-lived token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram long-lived token error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Instagram long-lived token request failed:', error);
      throw error;
    }
  }

  async refreshAccessToken(accessToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: accessToken
      });

      const response = await fetch(`${INSTAGRAM_HOSTS.GRAPH}/refresh_access_token?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Instagram token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram token refresh error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Instagram token refresh failed:', error);
      throw error;
    }
  }

  async createMedia(igUserId: string, accessToken: string, imageUrl: string, caption?: string): Promise<{
    id: string;
  }> {
    try {
      const apiVersion = 'v21.0';
      const requestBody: any = {
        image_url: imageUrl
      };

      if (caption) {
        requestBody.caption = caption;
      }

      const response = await fetch(`${INSTAGRAM_HOSTS.GRAPH}/${apiVersion}/${igUserId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Instagram media creation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram media creation error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Instagram media creation failed:', error);
      throw error;
    }
  }

  async createCarouselMedia(igUserId: string, accessToken: string, caption: string, childrenContainerIds: string[]): Promise<{
    id: string;
  }> {
    try {
      const apiVersion = 'v23.0';
      const requestBody = {
        caption: caption,
        media_type: 'CAROUSEL',
        children: childrenContainerIds.join(',')
      };

      const response = await fetch(`${INSTAGRAM_HOSTS.GRAPH}/${apiVersion}/${igUserId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Instagram carousel media creation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram carousel media creation error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Instagram carousel media creation failed:', error);
      throw error;
    }
  }

  async publishMedia(igUserId: string, accessToken: string, creationId: string): Promise<{
    id: string;
  }> {
    try {
      const apiVersion = 'v21.0';
      const requestBody = {
        creation_id: creationId
      };

      const response = await fetch(`${INSTAGRAM_HOSTS.GRAPH}/${apiVersion}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Instagram media publishing failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram media publishing error: ${data.error.message} (${data.error.code})`);
      }

      return data;
    } catch (error) {
      console.error('Instagram media publishing failed:', error);
      throw error;
    }
  }

  generateAuthUrl(redirectUri: string, state: string, scope?: string[]): string {
    const defaultScopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish'
    ];

    const scopes = scope || defaultScopes;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(','),
      state: state
    });

    return `${INSTAGRAM_HOSTS.NORMAL}/oauth/authorize?${params.toString()}`;
  }
}
