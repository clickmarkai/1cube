/**
 * Facebook Channel Implementation
 * Concrete implementation of BaseChannel for Facebook platform
 */

import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "./interface/channel-base";
import { channelsLogger } from "@/lib/logger";
import { FacebookApiClient, type FacebookConfig } from "../api-clients/facebook-api-client";
import { SessionRepository } from "../repositories";

export class FacebookChannel extends BaseChannel {
  private apiClient: FacebookApiClient;
  private sessionRepository: SessionRepository;

  constructor() {
    const config: ChannelConfig = {
      name: 'Facebook',
      description: 'Social media platform for connecting with friends and sharing content',
      requiredFields: []
    };

    super('facebook', config);

    const apiConfig: FacebookConfig = {
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_SECRET!
    };

    this.apiClient = new FacebookApiClient(apiConfig);
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

      channelsLogger.info('🔑 Facebook extractCredentials - Token map prepared');

      // Call getToken to exchange authorization code for access tokens
      const tokenResponse = await this.getToken(tokenMap);

      // Return credentials with actual tokens and Facebook user ID
      return {
        api_key: params.code, // Keep original code for reference
        shop_id: tokenResponse.user_id, // Store Facebook user ID in shop_id field
        token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expired_at: tokenResponse.token_expired_at,
        refresh_token_expired_at: tokenResponse.refresh_token_expired_at,
        token_type: 'Bearer',
        scope: params.scope || params.scopes,
        state: params.state
      };
    } catch (error) {
      channelsLogger.error('❌ Failed to extract Facebook credentials:', error);
      
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
      return { valid: false, error: `Facebook OAuth error: ${errorMsg}` };
    }

    // Validate required authorization code
    if (!params.code) {
      return { valid: false, error: 'Missing authorization code from Facebook OAuth' };
    }

    // Validate required state parameter for OAuth security
    if (!params.state) {
      return { valid: false, error: 'Missing state parameter for OAuth security validation' };
    }

    // Verify session state for security
    const stateVerification = await this.sessionRepository.verifySessionState(params.state);
    if (!stateVerification.valid) {
      return { valid: false, error: stateVerification.error || 'Invalid OAuth state for Facebook' };
    }

    // Log successful validation
    channelsLogger.debug('✅ Facebook OAuth parameters validated successfully');
    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);

    channelsLogger.debug(`🔗 Facebook generateAuthLink - State: ${state}, UserId: ${params.userId}`);

    // Store session state for OAuth security
    await this.sessionRepository.storeSessionState(state, params.userId, 'facebook');

    // Default scopes for Facebook API access
    const defaultScopes = [
      // 'email',
      'public_profile',
      'business_management'
    ];

    const scopes = params.scopes && params.scopes.length > 0 ? params.scopes : defaultScopes;

    const authLink = this.apiClient.generateAuthUrl(redirectUri, state, scopes);

    // Verify that the session state was stored successfully
    const verification = await this.sessionRepository.verifySessionState(state);
    if (!verification.valid) {
      throw new Error(`❌ Failed to store session state in database - OAuth link generation failed: ${verification.error}`);
    }

    channelsLogger.info('✅ Facebook auth link generated successfully with stored state');
    return { authLink, state };
  }

  async sync(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date, user_id?: string}> {
    try {
      const code = tokenMap.get('code');
      const redirectUri = tokenMap.get('redirect_uri');

      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!redirectUri) {
        throw new Error('Redirect URI is required');
      }

      channelsLogger.debug('🔑 Facebook getToken - Exchanging code for access token');

      // Exchange authorization code for access token
      const tokenResponse = await this.apiClient.getToken(code, redirectUri);
      
      channelsLogger.debug('✅ Facebook access token received');

      // Calculate expiration date if expires_in is provided
      let tokenExpiredAt: Date | undefined;
      if (tokenResponse.expires_in) {
        const now = new Date();
        tokenExpiredAt = new Date(now.getTime() + (tokenResponse.expires_in * 1000));
      }

      channelsLogger.info('✅ Facebook access token obtained successfully');

      return {
        access_token: tokenResponse.access_token,
        // Facebook may or may not provide refresh tokens depending on the app type
        refresh_token: tokenResponse.access_token, // Use the same token for refresh if no separate refresh token
        token_expired_at: tokenExpiredAt,
        refresh_token_expired_at: tokenExpiredAt, // Same expiration for both
        user_id: undefined // Facebook token response may not include user_id directly
      };
    } catch (error) {
      channelsLogger.error('❌ Failed to get Facebook access token:', error);
      throw error;
    }
  }

  async upload(files: File[], options: any): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async refreshToken(refreshToken: string): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async getProducts(): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async getOrders(): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
