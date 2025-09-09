/**
 * Abstract Channel Base Class
 * Acts like an interface in Java - defines the contract for all channel implementations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth.config";
import { ChannelsService } from "../../services";
import { channelsLogger } from "../../logger";
import { ChannelService } from "../../repositories";
import { TeamUserService } from "../../repositories";
import { TeamChannelService } from "../../repositories";

export interface ChannelCredentials {
  shop_id?: string;
  api_key?: string;
  api_secret?: string;
  token?: string;
  refresh_token?: string;
  code_verifier?: string;
  token_expired_at?: Date;
  refresh_token_expired_at?: Date;
  token_type?: string;
  scope?: string;
  state?: string;
}

export interface ChannelConfig {
  name: string;
  description: string;
  requiredFields: string[];
}

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

// Default team ID fallback (if user not in any team)
const DEFAULT_TEAM_ID = "4aaa07c6-8291-441d-bcf6-1b6621bb27d1";

export abstract class BaseChannel {
  protected channelName: string;
  protected config: ChannelConfig;

  constructor(channelName: string, config: ChannelConfig) {
    this.channelName = channelName;
    this.config = config;
  }

  // Abstract methods - must be implemented by concrete classes
  abstract extractCredentials(params: Record<string, string>): Promise<ChannelCredentials>;
  abstract validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }>;
  
  // Auth methods
  abstract generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult>;
  
  // Additional abstract methods for channel operations
  abstract sync(): Promise<void>;
  abstract getProducts(shopId: string, accessToken: string, options?: any): Promise<any[]>;
  abstract getOrders(): Promise<any[]>;
  abstract upload(files: File[], options: any): Promise<any>;

  // Token management abstract methods
  abstract refreshToken(refreshToken: string): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}>;

  // Concrete methods - shared by all channels
  async callback(request: NextRequest): Promise<NextResponse> {
    try {
      // Extract parameters from URL
      const params = this.extractParams(request);
      // Check for OAuth errors
      if (params.error) {
        return this.createErrorRedirect(request, `OAuth error: ${params.error_description || params.error}`);
      }

      // Validate required parameters
      if (!params.code) {
        return this.createErrorRedirect(request, 'Missing authorization code');
      }

      // Get user ID from session
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return this.createErrorRedirect(request, 'User not authenticated. Please login first.');
      }

      const userId = session.user.id;

      // Channel-specific validation
      const validation = await this.validateSpecificParams(params);
      if (!validation.valid) {
        return this.createErrorRedirect(request, validation.error || 'Validation failed');
      }

      // Extract credentials
      const credentials = await this.extractCredentials(params);
      
      // Validate credentials
      const credentialValidation = this.validateCredentials(credentials);
      if (!credentialValidation.valid) {
        return this.createErrorRedirect(request, `Missing required fields: ${credentialValidation.missing.join(', ')}`);
      }

      // Connect to database (legacy method for compatibility)
      await this.connectToDatabase(credentials, userId);
      
      // Success redirect
      // return this.createErrorRedirect(request, credentials.toString());
      return this.createSuccessRedirect(request);

    } catch (error) {
      console.error(`Callback error for ${this.channelName}:`, error);
      return this.createErrorRedirect(request, 'Authentication failed');
    }
  }

  getConfig(): ChannelConfig {
    return this.config;
  }

  getName(): string {
    return this.channelName;
  }

  // Protected helper methods
  protected extractParams(request: NextRequest): Record<string, string> {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  protected validateCredentials(credentials: ChannelCredentials): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const field of this.config.requiredFields) {
      if (!credentials[field as keyof ChannelCredentials]) {
        missing.push(field);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  protected async connectToDatabase(credentials: ChannelCredentials, userId: string): Promise<void> {
    // Get channel from database
    const channelData = await ChannelService.getChannelTypeByName(this.channelName);
    if (!channelData) {
      throw new Error(`Channel ${this.channelName} not found in database`);
    }

    // Get team ID for the user
    let teamId: string;
    try {
      const userTeamId = await TeamUserService.getTeamIdByUserId(userId);
      teamId = userTeamId || DEFAULT_TEAM_ID; // Fallback to default team if user not in any team
      
      if (!userTeamId) {
        channelsLogger.warn(`User ${userId} not found in any team, using default team ${DEFAULT_TEAM_ID}`);
      }
    } catch (error) {
      channelsLogger.error(`Error getting team for user ${userId}:`, error);
      teamId = DEFAULT_TEAM_ID; // Fallback to default team
    }

    // Connect team to channel
    await ChannelsService.connectTeamToChannel(
      teamId,
      channelData.id,
      credentials
    );

    channelsLogger.info(`Successfully connected ${this.channelName} for user ${userId} in team ${teamId}`);
  }

  protected createSuccessRedirect(request: NextRequest): NextResponse {
    const successUrl = new URL('/app/settings', request.url);
    successUrl.searchParams.set('success', `${this.channelName}_connected`);
    successUrl.searchParams.set('success_message', `${this.config.name} connected successfully!`);
    
    return NextResponse.redirect(successUrl);
  }

  protected createErrorRedirect(request: NextRequest, error: string): NextResponse {
    const errorUrl = new URL('/app/settings', request.url);
    errorUrl.searchParams.set('error', 'connection_failed');
    errorUrl.searchParams.set('error_message', error);
    
    return NextResponse.redirect(errorUrl);
  }

  // Protected helper methods for auth
  protected generateState(userId: string): string {
    const crypto = require('crypto');
    // Generate random state for OAuth security (no longer embedding user ID)
    return crypto.randomBytes(32).toString('hex');
  }

  protected getRedirectUri(customRedirectUri?: string): string {
    if (customRedirectUri) {
      return customRedirectUri;
    }
    // return `https://1cube.netlify.app/api/callback/auth/${this.channelName.toLowerCase()}/`;
    
    // For Faster Debugging, use this instead of the above
    return `http://localhost:3000/api/callback/auth/${this.channelName.toLowerCase()}/`;
    // return `${process.env.BASE_URL || 'http://localhost:3000'}/api/callback/auth/${this.channelName.toLowerCase()}`;
  }

  // Token management helper methods
  protected isTokenExpired(tokenExpiredAt?: Date): boolean {
    if (!tokenExpiredAt) {
      return true; // If no expiration date, consider expired
    }
    
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer before actual expiration
    
    return tokenExpiredAt.getTime() <= (now.getTime() + bufferTime);
  }

  protected isRefreshTokenExpired(refreshTokenExpiredAt?: Date): boolean {
    if (!refreshTokenExpiredAt) {
      return true; // If no expiration date, consider expired
    }
    
    const now = new Date();
    return refreshTokenExpiredAt.getTime() <= now.getTime();
  }

  /**
   * Get valid access token, refreshing if necessary
   * @param credentials Current channel credentials
   * @returns Valid credentials with fresh access token
   */
  protected async getValidCredentials(credentials: ChannelCredentials): Promise<ChannelCredentials> {
    // Check if access token is expired
    if (!this.isTokenExpired(credentials.token_expired_at)) {
      return credentials; // Token is still valid
    }

    // Check if refresh token is available and not expired
    if (!credentials.refresh_token) {
      throw new Error('No refresh token available for token refresh');
    }

    if (this.isRefreshTokenExpired(credentials.refresh_token_expired_at)) {
      throw new Error('Refresh token has expired. Re-authorization required.');
    }

    // Refresh the access token
    try {
      const refreshResponse = await this.refreshToken(credentials.refresh_token);
      
      // Update credentials with new tokens
      const updatedCredentials: ChannelCredentials = {
        ...credentials,
        token: refreshResponse.access_token,
        token_expired_at: refreshResponse.token_expired_at,
      };

      // Update refresh token if provided
      if (refreshResponse.refresh_token) {
        updatedCredentials.refresh_token = refreshResponse.refresh_token;
        updatedCredentials.refresh_token_expired_at = refreshResponse.refresh_token_expired_at;
      }

      return updatedCredentials;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Update tokens in database for a specific team and channel
   * @param teamId Team ID
   * @param channelId Channel ID
   * @param tokenResponse Token response from API
   */
  protected async updateTokensInDatabase(
    teamId: string, 
    channelId: string, 
    tokenResponse: {
      access_token: string; 
      refresh_token?: string; 
      token_expired_at?: Date; 
      refresh_token_expired_at?: Date
    }
  ): Promise<void> {
    try {
      const now = new Date();
      // Use provided expiration dates or calculate defaults
      const tokenExpiresAt = tokenResponse.token_expired_at || new Date(now.getTime() + (86400 * 1000));
      const refreshTokenExpiresAt = tokenResponse.refresh_token_expired_at || new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      channelsLogger.debug(`Updating ${this.channelName} tokens in database:`, {
        teamId,
        channelId,
        token_expired_at_from_api: tokenResponse.token_expired_at?.toISOString(),
        refresh_token_expired_at_from_api: tokenResponse.refresh_token_expired_at?.toISOString(),
        token_expires_at: tokenExpiresAt.toISOString(),
        refresh_token_expires_at: refreshTokenExpiresAt.toISOString()
      });
      
      // Update tokens in database
      await TeamChannelService.updateTeamChannelCredentials(teamId, channelId, {
        token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || undefined,
        token_expires_at: tokenExpiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        token_created_at: now,
        last_token_refresh: now
      } as any);
      
      channelsLogger.info(`✅ Updated ${this.channelName} tokens in database for team ${teamId} - expires at ${tokenExpiresAt.toISOString()}`);
    } catch (error) {
      channelsLogger.error(`Error updating ${this.channelName} tokens in database:`, error);
      throw error;
    }
  }

  /**
   * Refresh token if it's about to expire
   * @param teamChannelConfig Team channel configuration
   * @returns Valid access token or null if refresh failed
   */
  protected async refreshTokenIfNeeded(teamChannelConfig: any): Promise<string | null> {
    try {
      const now = new Date();
      const bufferTime = 10 * 60 * 1000; // 10 minutes buffer
      const tokenExpiresAt = teamChannelConfig.token_expires_at ? new Date(teamChannelConfig.token_expires_at) : null;
      
      // Check if token is expiring soon
      if (tokenExpiresAt && tokenExpiresAt.getTime() <= (now.getTime() + bufferTime)) {
        channelsLogger.info(`🔄 ${this.channelName} access token expiring soon, attempting refresh...`);
        
        if (!teamChannelConfig.refresh_token) {
          channelsLogger.error(`❌ No refresh token available for ${this.channelName}`);
          return null;
        }
        
        // Check if refresh token is still valid
        const refreshTokenExpiresAt = teamChannelConfig.refresh_token_expires_at ? new Date(teamChannelConfig.refresh_token_expires_at) : null;
        if (refreshTokenExpiresAt && refreshTokenExpiresAt.getTime() <= now.getTime()) {
          channelsLogger.error(`❌ ${this.channelName} refresh token has expired`);
          return null;
        }
        
        // Attempt to refresh the token
        const tokenResponse = await this.refreshToken(teamChannelConfig.refresh_token);
        
        // Update tokens in database
        await this.updateTokensInDatabase(teamChannelConfig.team, teamChannelConfig.channel_id, tokenResponse);
        
        channelsLogger.info(`✅ Successfully refreshed ${this.channelName} access token`);
        return tokenResponse.access_token;
      }
      
      // Token is still valid
      return teamChannelConfig.token;
    } catch (error) {
      channelsLogger.error(`❌ Failed to refresh ${this.channelName} token:`, error);
      return null;
    }
  }

  /**
   * Get a valid access token for operations, automatically refreshing if needed
   * @param teamId Team ID
   * @param channelId Channel ID
   * @returns Valid access token
   */
  protected async getValidAccessToken(teamId: string, channelId: string): Promise<string> {
    try {
      // Get current team channel configuration
      const teamChannelConfig = await TeamChannelService.getTeamChannel(teamId, channelId);
      
      if (!teamChannelConfig) {
        throw new Error(`No ${this.channelName} connection found for team ${teamId}`);
      }
      
      if (!teamChannelConfig.connected) {
        throw new Error(`${this.channelName} is not connected for team ${teamId}`);
      }
      
      // Try to refresh token if needed
      const validToken = await this.refreshTokenIfNeeded(teamChannelConfig);
      
      if (!validToken) {
        throw new Error(`Unable to obtain valid ${this.channelName} access token. Please reconnect your account.`);
      }
      
      return validToken;
    } catch (error) {
      channelsLogger.error(`Error getting valid ${this.channelName} access token:`, error);
      throw error;
    }
  }

  /**
   * Get user's access token by looking up their team and channel configuration
   * @param userId User ID
   * @returns Valid access token or null if not found/invalid
   */
  protected async getUserAccessToken(userId: string): Promise<string | null> {
    try {
      channelsLogger.debug(`Looking up ${this.channelName} access token for user: ${userId}`);
      
      // Step 1: Get user's team ID
      const teamId = await TeamUserService.getTeamIdByUserId(userId);
      if (!teamId) {
        channelsLogger.warn(`User ${userId} is not associated with any team`);
        return null;
      }
      
      // Step 2: Get channel type ID from database
      const channelType = await ChannelService.getChannelTypeByName(this.channelName.toLowerCase());
      if (!channelType) {
        channelsLogger.error(`${this.channelName} channel type not found in database`);
        return null;
      }
      
      // Step 3: Get team's channel configuration
      const teamChannelConfig = await TeamChannelService.getTeamChannel(teamId, channelType.id);
      if (!teamChannelConfig) {
        channelsLogger.debug(`Team ${teamId} does not have ${this.channelName} channel configured`);
        return null;
      }
      
      // Step 4: Check if channel is connected
      if (!teamChannelConfig.connected) {
        channelsLogger.debug(`${this.channelName} channel is not connected for team ${teamId}`);
        return null;
      }
      
      // Step 5: Check token expiration and refresh if needed
      const validToken = await this.refreshTokenIfNeeded(teamChannelConfig);
      if (!validToken) {
        channelsLogger.warn(`Unable to get valid ${this.channelName} access token for team ${teamId}`);
        return null;
      }
      
      channelsLogger.info(`✅ Found valid ${this.channelName} access token for user ${userId} (team: ${teamId})`);
      return validToken;
      
    } catch (error) {
      channelsLogger.error(`Error retrieving ${this.channelName} access token:`, error);
      return null;
    }
  }


  /**
   * Example usage method for concrete channels
   * Shows how to use the token management system in channel operations
   */
  protected async exampleChannelOperation(teamId: string, channelId: string): Promise<any> {
    try {
      // Get a valid access token (automatically refreshes if needed)
      const accessToken = await this.getValidAccessToken(teamId, channelId);
      
      // Use the token for API calls
      // Example: const result = await this.makeApiCall(accessToken);
      
      channelsLogger.info(`✅ ${this.channelName} operation completed successfully`);
      return { success: true, accessToken };
      
    } catch (error) {
      channelsLogger.error(`❌ ${this.channelName} operation failed:`, error);
      throw error;
    }
  }

  abstract getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}>;
}
