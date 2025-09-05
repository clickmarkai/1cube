/**
 * TikTok Channel Implementation
 * Concrete implementation of BaseChannel for TikTok marketplace
 */

import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "../channel-base";
import { channelsLogger } from "@/lib/logger";
import { TikTokApiClient, type TikTokConfig } from "../api-clients/tiktok-api-client";
import { SessionRepository } from "../repositories";


export class TikTokChannel extends BaseChannel {
  private readonly HOST = process.env.TIKTOK_HOST!;
  private readonly APP_ID = process.env.TIKTOK_APP_ID!;
  private readonly APP_SECRET = process.env.TIKTOK_APP_SECRET!;
  private readonly CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
  private apiClient: TikTokApiClient;
  private sessionRepository: SessionRepository;

  constructor() {
    const config: ChannelConfig = {
      name: 'TikTok',
      description: 'Global platform for short-form video content and shopping',
      requiredFields: []
    };

    super('tiktok', config);

    const apiConfig: TikTokConfig = {
      host: this.HOST,
      appId: this.APP_ID,
      appSecret: this.APP_SECRET,
      clientKey: this.CLIENT_KEY
    };
    this.apiClient = new TikTokApiClient(apiConfig);
    this.sessionRepository = new SessionRepository();
  }

  extractCredentials(params: Record<string, string>): ChannelCredentials {
    return {
      api_key: params.code
    };
  }

  async validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }> {
    if (params.error) {
      const errorMsg = params.error_description || params.error;
      return { valid: false, error: `TikTok OAuth error: ${errorMsg}` };
    }

    if (!params.code) {
      return { valid: false, error: 'Missing authorization code from TikTok OAuth' };
    }

    if (!params.state) {
      return { valid: false, error: 'Missing state parameter for OAuth security validation' };
    }

    const stateVerification = await this.sessionRepository.verifySessionState(params.state);
    if (!stateVerification.valid) {
      return { valid: false, error: stateVerification.error || 'Invalid OAuth state for TikTok' };
    }

    if (!params.scopes) {
      channelsLogger.warn('No scopes returned from TikTok OAuth - this may indicate limited permissions');
    }

    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);

    channelsLogger.debug(`🔗 TikTok generateAuthLink - State: ${state}, UserId: ${params.userId}`);

    const { codeVerifier } = this.apiClient.generatePKCEParams();

    await this.sessionRepository.storeSessionState(state, params.userId, 'tiktok', codeVerifier);

    // Default scopes for TikTok API access
    const defaultScopes = [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
      'video.upload'
    ];

    const scopes = params.scopes && params.scopes.length > 0 ? params.scopes : defaultScopes;

    const authLink = this.apiClient.generateAuthUrl(redirectUri, state, scopes);

    const verification = await this.sessionRepository.verifySessionState(state);
    if (!verification.valid) {
      throw new Error(`❌ Failed to store session state in database - OAuth link generation failed: ${verification.error}`);
    }

    channelsLogger.info('✅ TikTok auth link generated successfully with stored state');
    return { authLink, state };
  }

  async sync(): Promise<void> {
    // TODO: Implement TikTok-specific sync logic
    channelsLogger.debug(`Syncing ${this.getName()} data...`);
  }

  async getProducts(shopId: string, accessToken: string, options?: any): Promise<any[]> {
    // TODO: Implement TikTok-specific product fetching
    channelsLogger.debug(`Fetching products from ${this.getName()}...`);
    return [];
  }

  async getOrders(): Promise<any[]> {
    // TODO: Implement TikTok-specific order fetching
    channelsLogger.debug(`Fetching orders from ${this.getName()}...`);
    return [];
  }

  async getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string}> {
    try {
      const code = tokenMap.get('code');
      const state = tokenMap.get('state');
      const redirectUri = tokenMap.get('redirect_uri');

      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!state) {
        throw new Error('State parameter is required for security validation');
      }

      if (!redirectUri) {
        throw new Error('Redirect URI is required');
      }

      // Get the code verifier from stored state
      const codeVerifier = await this.sessionRepository.getCodeVerifier(state);
      if (!codeVerifier) {
        throw new Error('Code verifier not found for the provided state');
      }

      // Exchange authorization code for access token using API client
      const tokenResponse = await this.apiClient.getAccessToken(code, codeVerifier, redirectUri);

      channelsLogger.info('✅ Successfully obtained access token from TikTok');
      return tokenResponse;
    } catch (error) {
      channelsLogger.error('❌ Failed to get TikTok access token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{access_token: string, refresh_token?: string}> {
    try {
      const tokenResponse = await this.apiClient.refreshAccessToken(refreshToken);
      channelsLogger.info('✅ Successfully refreshed TikTok access token');
      return tokenResponse;
    } catch (error) {
      channelsLogger.error('❌ Failed to refresh TikTok access token:', error);
      throw error;
    }
  }

}
