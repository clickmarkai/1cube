/**
 * Instagram Channel Implementation
 * Concrete implementation of BaseChannel for Instagram platform
 */

import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "./interface/channel-base";
import { channelsLogger } from "@/lib/logger";
import { InstagramApiClient, type InstagramConfig } from "../api-clients/instagram-api-client";
import { SessionRepository } from "../repositories";

export class InstagramChannel extends BaseChannel {
  private apiClient: InstagramApiClient;
  private sessionRepository: SessionRepository;

  constructor() {
    const config: ChannelConfig = {
      name: 'Instagram',
      description: 'Social media platform for photo and video sharing',
      requiredFields: []
    };

    super('instagram', config);

    const apiConfig: InstagramConfig = {
      clientId: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_SECRET!
    };

    this.apiClient = new InstagramApiClient(apiConfig);
    this.sessionRepository = new SessionRepository();
  }

  async extractCredentials(params: Record<string, string>): Promise<ChannelCredentials> {
    try {
      // Verify session state first
      const verification = await this.sessionRepository.verifySessionState(params.state);
      if (!verification.valid || !verification.userId) {
        throw new Error('Invalid OAuth state or missing user information');
      }

      // Create token map for getToken method (following BaseChannel pattern)
      const tokenMap = new Map<string, string>();
      tokenMap.set('code', params.code);
      tokenMap.set('state', params.state);
      tokenMap.set('redirect_uri', this.getRedirectUri());

      channelsLogger.info('🔑 Instagram extractCredentials - Token map prepared');

      // Call getToken to exchange authorization code for access tokens
      const tokenResponse = await this.getToken(tokenMap);

      // Return credentials with actual tokens
      return {
        api_key: params.code, // Keep original code for reference
        token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expired_at: tokenResponse.token_expired_at,
        refresh_token_expired_at: tokenResponse.refresh_token_expired_at,
        token_type: 'Bearer',
        scope: params.scope || params.scopes,
        state: params.state
      };
    } catch (error) {
      channelsLogger.error('❌ Failed to extract Instagram credentials:', error);
      
      // Fallback to just returning the authorization code if token exchange fails
      return {
        api_key: params.code,
        state: params.state,
        scope: params.scope || params.scopes
      };
    }
  }

  async validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }> {
    // Check for OAuth errors first
    if (params.error) {
      const errorMsg = params.error_description || params.error;
      return { valid: false, error: `Instagram OAuth error: ${errorMsg}` };
    }

    // Validate required authorization code
    if (!params.code) {
      return { valid: false, error: 'Missing authorization code from Instagram OAuth' };
    }

    // Validate required state parameter for OAuth security
    if (!params.state) {
      return { valid: false, error: 'Missing state parameter for OAuth security validation' };
    }

    // Verify session state for security
    const stateVerification = await this.sessionRepository.verifySessionState(params.state);
    if (!stateVerification.valid) {
      return { valid: false, error: stateVerification.error || 'Invalid OAuth state for Instagram' };
    }

    // Log successful validation
    channelsLogger.debug('✅ Instagram OAuth parameters validated successfully');
    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);

    channelsLogger.debug(`🔗 Instagram generateAuthLink - State: ${state}, UserId: ${params.userId}`);

    // Store session state for OAuth security
    await this.sessionRepository.storeSessionState(state, params.userId, 'instagram');

    // Default scopes for Instagram API access
    const defaultScopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish'
    ];

    const scopes = params.scopes && params.scopes.length > 0 ? params.scopes : defaultScopes;

    const authLink = this.apiClient.generateAuthUrl(redirectUri, state, scopes);

    // Verify that the session state was stored successfully
    const verification = await this.sessionRepository.verifySessionState(state);
    if (!verification.valid) {
      throw new Error(`❌ Failed to store session state in database - OAuth link generation failed: ${verification.error}`);
    }

    channelsLogger.info('✅ Instagram auth link generated successfully with stored state');
    return { authLink, state };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string; token_expired_at?: Date; refresh_token_expired_at?: Date }> {
    try {
      channelsLogger.debug('🔄 Instagram refreshToken - Refreshing access token');

      // Instagram token refresh uses the current access token to get a new one
      const refreshResponse = await this.apiClient.refreshAccessToken(refreshToken);

      // Calculate new expiration date (60 days from now)
      const now = new Date();
      const tokenExpiredAt = new Date(now.getTime() + (refreshResponse.expires_in * 1000));

      channelsLogger.info('✅ Instagram access token refreshed successfully');

      return {
        access_token: refreshResponse.access_token,
        refresh_token: refreshResponse.access_token, // Instagram uses the same token for refresh
        token_expired_at: tokenExpiredAt,
        refresh_token_expired_at: tokenExpiredAt
      };
    } catch (error) {
      channelsLogger.error('❌ Failed to refresh Instagram access token:', error);
      throw error;
    }
  }

  async getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}> {
    try {
      const code = tokenMap.get('code');
      const redirectUri = tokenMap.get('redirect_uri');

      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!redirectUri) {
        throw new Error('Redirect URI is required');
      }

      channelsLogger.debug('🔑 Instagram getToken - Exchanging code for access token');

      // Step 1: Exchange authorization code for short-lived access token
      const shortTokenResponse = await this.apiClient.getToken(code, redirectUri);
      
      channelsLogger.debug('✅ Instagram short-lived token received, exchanging for long-lived token');

      // Step 2: Exchange short-lived token for long-lived access token (60 days)
      const longTokenResponse = await this.apiClient.getLongLivedToken(shortTokenResponse.access_token);

      // Calculate expiration date (60 days from now)
      const now = new Date();
      const tokenExpiredAt = new Date(now.getTime() + (longTokenResponse.expires_in * 1000));

      channelsLogger.info('✅ Instagram long-lived access token obtained successfully');

      return {
        access_token: longTokenResponse.access_token,
        // Instagram doesn't provide refresh tokens in the traditional sense - tokens are refreshed by calling refresh endpoint
        refresh_token: longTokenResponse.access_token, // Use the same token for refresh
        token_expired_at: tokenExpiredAt,
        refresh_token_expired_at: tokenExpiredAt // Same expiration for both
      };
    } catch (error) {
      channelsLogger.error('❌ Failed to get Instagram access token:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    // TODO: Implement Instagram sync
    throw new Error('sync not implemented yet');
  }

  async getProducts(): Promise<any[]> {
    // TODO: Implement Instagram getProducts
    throw new Error('getProducts not implemented yet');
  }

  async getOrders(): Promise<any[]> {
    // TODO: Implement Instagram getOrders
    throw new Error('getOrders not implemented yet');
  }

  async upload(files: File[], options: any): Promise<any> {
    // TODO: Implement Instagram upload
    throw new Error('upload not implemented yet');
  }
}
