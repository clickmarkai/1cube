import crypto from 'crypto';

export interface TikTokConfig {
  host: string;
  appId: string;
  appSecret: string;
  clientKey: string;
}

export interface VideoPostInfo {
  title: string;
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
  disable_duet?: boolean;
  disable_comment?: boolean;
  disable_stitch?: boolean;
  video_cover_timestamp_ms?: number;
  brand_content_toggle?: boolean;
  brand_organic_toggle?: boolean;
}

export interface VideoSourceInfo {
  source: 'FILE_UPLOAD' | 'PULL_FROM_URL';
  video_size: number;
  chunk_size?: number;
  total_chunk_count?: number;
  video_url?: string;
}

export interface VideoPublishInitRequest {
  post_info: VideoPostInfo;
  source_info: VideoSourceInfo;
}

export interface VideoPublishInitResponse {
  data: {
    publish_id: string;
    upload_url?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface PhotoPostInfo {
  title: string;
  description?: string;
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
  disable_comment?: boolean;
  disable_duet?: boolean;
  disable_stitch?: boolean;
  auto_add_music?: boolean;
  brand_content_toggle?: boolean;
  brand_organic_toggle?: boolean;
}

export interface PhotoSourceInfo {
  source: 'PULL_FROM_URL' | 'FILE_UPLOAD';
  photo_cover_index?: number;
  photo_images: string[];
}

export interface PhotoPublishInitRequest {
  post_info: PhotoPostInfo;
  source_info: PhotoSourceInfo;
  post_mode: 'DIRECT_POST' | 'SCHEDULED_POST';
  media_type: 'PHOTO';
}

export interface PhotoPublishInitResponse {
  data: {
    publish_id: string;
    upload_url?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export class TikTokApiClient {
  private config: TikTokConfig;

  constructor(config: TikTokConfig) {
    this.config = config;
  }

  generatePKCEParams(): { codeChallenge: string; codeVerifier: string } {
    const codeVerifier = crypto.randomBytes(32).toString("hex");

    const base64url = (str: Buffer): string =>
      str.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const codeChallenge = base64url(
      crypto.createHash("sha256").update(codeVerifier).digest()
    );

    return { codeChallenge, codeVerifier };
  }

  generateAuthUrl(
    redirectUri: string,
    state: string,
    scopes: string[] = ['user.info.basic']
  ): string {
    const { codeChallenge } = this.generatePKCEParams();
    
    const scopeString = scopes.join(',');

    return (
      'https://www.tiktok.com/v2/auth/authorize/?' +
      `client_key=${this.config.clientKey}&` +
      'response_type=code&' +
      `scope=${encodeURIComponent(scopeString)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`
    );
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    queryParams: Record<string, any> = {},
    body?: Record<string, any>,
    headers: Record<string, string> = {},
    baseUrl?: string
  ): Promise<any> {
    try {
      const baseHost = baseUrl || this.config.host;
      const url = new URL(`${baseHost}${endpoint}`);
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          ...headers
        }
      };

      if (body && method === 'POST') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url.toString(), requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`TikTok API error: ${data.error.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('TikTok API request failed:', error);
      throw error;
    }
  }

  async getAccessToken(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{access_token: string, refresh_token?: string}> {
    const requestBody = {
      client_key: this.config.clientKey,
      client_secret: this.config.appSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    };

    return await this.makeRequest(
      '/oauth/access_token/',
      'POST',
      {},
      requestBody
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<{access_token: string, refresh_token?: string}> {
    const requestBody = {
      client_key: this.config.clientKey,
      client_secret: this.config.appSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    return await this.makeRequest(
      '/oauth/refresh_token/',
      'POST',
      {},
      requestBody
    );
  }

  async initVideoPublish(
    accessToken: string,
    request: VideoPublishInitRequest
  ): Promise<VideoPublishInitResponse> {
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    return await this.makeRequest(
      '/v2/post/publish/video/init/',
      'POST',
      {},
      request,
      headers,
      'https://open.tiktokapis.com'
    );
  }

  async initPhotoPublish(
    accessToken: string,
    request: PhotoPublishInitRequest
  ): Promise<PhotoPublishInitResponse> {
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    return await this.makeRequest(
      '/v2/post/publish/content/init/',
      'POST',
      {},
      request,
      headers,
      'https://open.tiktokapis.com'
    );
  }

  createVideoPublishRequest(
    title: string,
    videoSize: number,
    options?: {
      privacyLevel?: VideoPostInfo['privacy_level'];
      disableDuet?: boolean;
      disableComment?: boolean;
      disableStitch?: boolean;
      videoCoverTimestampMs?: number;
      chunkSize?: number;
      totalChunkCount?: number;
    }
  ): VideoPublishInitRequest {
    return {
      post_info: {
        title,
        privacy_level: options?.privacyLevel || 'PUBLIC_TO_EVERYONE',
        disable_duet: options?.disableDuet || false,
        disable_comment: options?.disableComment || false,
        disable_stitch: options?.disableStitch || false,
        video_cover_timestamp_ms: options?.videoCoverTimestampMs
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: options?.chunkSize,
        total_chunk_count: options?.totalChunkCount
      }
    };
  }

  createPhotoPublishRequest(
    title: string,
    photoUrls: string[],
    options?: {
      description?: string;
      privacyLevel?: PhotoPostInfo['privacy_level'];
      disableComment?: boolean;
      disableDuet?: boolean;
      disableStitch?: boolean;
      autoAddMusic?: boolean;
      photoCoverIndex?: number;
      postMode?: 'DIRECT_POST' | 'SCHEDULED_POST';
    }
  ): PhotoPublishInitRequest {
    return {
      post_info: {
        title,
        description: options?.description,
        privacy_level: options?.privacyLevel || 'PUBLIC_TO_EVERYONE',
        disable_comment: options?.disableComment || false,
        disable_duet: options?.disableDuet || false,
        disable_stitch: options?.disableStitch || false,
        auto_add_music: options?.autoAddMusic || false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: options?.photoCoverIndex || 1,
        photo_images: photoUrls
      },
      post_mode: options?.postMode || 'DIRECT_POST',
      media_type: 'PHOTO'
    };
  }
}
