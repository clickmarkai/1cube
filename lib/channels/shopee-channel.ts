/**
 * Shopee Channel Implementation
 * Concrete implementation of BaseChannel for Shopee marketplace
 */

import crypto from 'crypto';
import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "./interface/channel-base";
import { ChannelService, TeamUserService } from "../repositories";
import { ChannelsService } from "../services/channels-service";
import { channelsLogger } from "@/lib/logger";

// Global type declarations for OAuth state storage
declare global {
  var oauthStates: Map<string, {
    state: string;
    userId: string;
    channelName: string;
    timestamp: number;
    codeVerifier?: string;
  }> | undefined;
}

export class ShopeeChannel extends BaseChannel {
  private readonly HOST = "https://openplatform.sandbox.test-stable.shopee.sg";
  private readonly PARTNER_ID = 1181853;
  private readonly PARTNER_KEY = "shpk4862574b726c77774655794f5241555a534d447876475678795048577a61";

  constructor() {
    const config: ChannelConfig = {
      name: 'Shopee',
      description: 'Southeast Asia\'s leading e-commerce platform',
      requiredFields: ['shop_id', 'api_key']
    };
    
    super('shopee', config);
  }



  extractCredentials(params: Record<string, string>): ChannelCredentials {
    return {
      shop_id: params.shop_id,
      api_key: params.code, // Shopee uses 'code' as API key from OAuth
      api_secret: params.api_secret // Optional for Shopee
    };
  }

  async validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }> {
    if (!params.shop_id) {
      return { valid: false, error: 'Missing shop_id parameter' };
    }

    if (!params.code) {
      return { valid: false, error: 'Missing authorization code' };
    }

    // Verify OAuth state parameter for security
    if (!params.state) {
      return { valid: false, error: 'Missing OAuth state parameter' };
    }

    const stateVerification = await this.verifySessionState(params.state);
    if (!stateVerification.valid) {
      return { valid: false, error: stateVerification.error || 'Invalid OAuth state for Shopee' };
    }

    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiPath = "/api/v2/shop/auth_partner";

    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);
    const redirectUriWithState = `${redirectUri}?state=${state}`;

    // Store state in session for verification during callback
    await this.storeSessionState(state, params.userId, 'shopee');

    const baseString = `${this.PARTNER_ID}${apiPath}${timestamp}`;

    const signature = crypto
      .createHmac('sha256', this.PARTNER_KEY)
      .update(baseString)
      .digest('hex');

    const authLink = 
      `${this.HOST}${apiPath}?` +
      `partner_id=${this.PARTNER_ID}&` +
      `redirect=${encodeURIComponent(redirectUriWithState)}&` +
      `timestamp=${timestamp}&` +
      `sign=${signature}`;

    return { authLink, state };
  }

  // Additional Shopee-specific methods can be added here
  async sync(): Promise<void> {
    channelsLogger.debug(`Syncing ${this.getName()} data...`);
    // TODO: Implement Shopee-specific sync logic
  }

  async getProducts(
    shopId: string, 
    accessToken: string,
    options?: {
      pageSize?: number;
      itemStatus?: 'NORMAL' | 'SELLER_DELETE' | 'BANNED' | 'UNLIST' | 'SHOPEE_DELETE' | 'REVIEWING';
      updateTimeFrom?: number; // Unix timestamp
      updateTimeTo?: number;   // Unix timestamp
    }
  ): Promise<any[]> {
    try {
      channelsLogger.debug(`Fetching products from ${this.getName()}...`);
      
      const pageSize = options?.pageSize || 100; // Default page size
      const itemStatus = options?.itemStatus || 'NORMAL';
      let allProducts: any[] = [];
      let offset = 0;
      let hasNextPage = true;

      while (hasNextPage) {
        // Build query parameters
        const queryParams: Record<string, any> = {
          shop_id: shopId,
          access_token: accessToken,
          offset: offset.toString(),
          page_size: pageSize.toString(),
          item_status: itemStatus
        };

        // Add optional date filters if provided
        if (options?.updateTimeFrom) {
          queryParams.update_time_from = options.updateTimeFrom.toString();
        }
        if (options?.updateTimeTo) {
          queryParams.update_time_to = options.updateTimeTo.toString();
        }

        // Make the GET request using base method
        const responseData = await this.makeAuthenticatedRequest(
          this.HOST,
          "/api/v2/product/get_item_list",
          this.PARTNER_ID.toString(),
          (requestOptions) => {
            // Shopee uses HMAC-SHA256 with partner_id + path + timestamp
            const baseString = `${this.PARTNER_ID}${new URL(requestOptions.uri).pathname}${requestOptions.qs.timestamp}`;
            return crypto
              .createHmac('sha256', this.PARTNER_KEY)
              .update(baseString)
              .digest('hex');
          },
          'GET',
          queryParams
        );
        
        // Check for API error
        if (responseData.error) {
          throw new Error(`Shopee API error: ${responseData.error} - ${responseData.message}`);
        }

        const products = responseData.response?.item || [];
        allProducts.push(...products);

        // Check pagination
        hasNextPage = responseData.response?.has_next_page || false;
        
        if (hasNextPage) {
          // Update offset for next page
          offset += pageSize;
          channelsLogger.debug(`📦 Fetched ${products.length} products (page ${Math.floor(offset / pageSize)}), continuing...`);
        } else {
          channelsLogger.debug(`📦 Fetched ${products.length} products (final page)`);
        }
      }

      channelsLogger.info(`✅ Successfully fetched ${allProducts.length} total products from Shopee shop ${shopId}`);
      return allProducts;
      
    } catch (error) {
      channelsLogger.error('❌ Error fetching Shopee products:', error);
      throw error;
    }
  }

  async getProductDetails(
    shopId: string,
    accessToken: string,
    itemIds: number[],
    options?: {
      needTaxInfo?: boolean;
      needComplaintPolicy?: boolean;
    }
  ): Promise<any[]> {
    try {
      channelsLogger.debug(`Fetching product details from ${this.getName()} for ${itemIds.length} items...`);
      
      if (!itemIds || itemIds.length === 0) {
        throw new Error('At least one item_id is required');
      }

      // Shopee API supports max 50 items per request
      const MAX_ITEMS_PER_REQUEST = 50;
      let allProductDetails: any[] = [];

      // Process items in batches
      for (let i = 0; i < itemIds.length; i += MAX_ITEMS_PER_REQUEST) {
        const batchItemIds = itemIds.slice(i, i + MAX_ITEMS_PER_REQUEST);
        
        // Build query parameters
        const queryParams: Record<string, any> = {
          shop_id: shopId,
          access_token: accessToken,
          item_id_list: batchItemIds.join(','),
          need_tax_info: (options?.needTaxInfo ?? true).toString(),
          need_complaint_policy: (options?.needComplaintPolicy ?? true).toString()
        };

        // Make the GET request using base method
        const responseData = await this.makeAuthenticatedRequest(
          this.HOST,
          "/api/v2/product/get_item_base_info",
          this.PARTNER_ID.toString(),
          (requestOptions) => {
            // Shopee uses HMAC-SHA256 with partner_id + path + timestamp
            const baseString = `${this.PARTNER_ID}${new URL(requestOptions.uri).pathname}${requestOptions.qs.timestamp}`;
            return crypto
              .createHmac('sha256', this.PARTNER_KEY)
              .update(baseString)
              .digest('hex');
          },
          'GET',
          queryParams
        );
        
        // Check for API error
        if (responseData.error) {
          throw new Error(`Shopee API error: ${responseData.error} - ${responseData.message}`);
        }

        const productDetails = responseData.response?.item_list || [];
        allProductDetails.push(...productDetails);

        channelsLogger.debug(`📦 Fetched details for ${productDetails.length} products (batch ${Math.floor(i / MAX_ITEMS_PER_REQUEST) + 1})`);
        
        // Add small delay between batches to avoid rate limiting
        if (i + MAX_ITEMS_PER_REQUEST < itemIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      channelsLogger.info(`✅ Successfully fetched details for ${allProductDetails.length} total products from Shopee shop ${shopId}`);
      return allProductDetails;
      
    } catch (error) {
      channelsLogger.error('❌ Error fetching Shopee product details:', error);
      throw error;
    }
  }

  async getOrders(): Promise<any[]> {
    channelsLogger.debug(`Fetching orders from ${this.getName()}...`);
    // TODO: Implement Shopee-specific order fetching
    return [];
  }

  async upload(files: File[], options: any): Promise<any> {
    // TODO: Implement Shopee-specific upload logic
    channelsLogger.debug(`Uploading ${files.length} files to ${this.getName()}...`);
    return {
      success: false,
      error: "Shopee upload not yet implemented"
    };
  }

  // Database-based session state storage  
  private async storeSessionState(state: string, userId: string, channelName: string): Promise<void> {
    try {
      channelsLogger.debug(`📦 Storing Shopee session state in DB - State: ${state}, UserId: ${userId}, Channel: ${channelName}`);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const response = await fetch(`${supabaseUrl}/rest/v1/user_state`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          state,
          user_id: userId,
          channel_name: channelName,
          code_verifier: null // Shopee doesn't use PKCE
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Database storage failed: ${response.status} ${error}`);
      }
      
      // Clean up expired states in database
      await this.cleanupExpiredStates();
      
      channelsLogger.info(`✅ Stored OAuth state for ${channelName} channel, user ${userId} in database`);
    } catch (error) {
      channelsLogger.error('❌ Error storing session state in database:', error);
      throw error; // Re-throw to prevent auth link generation if storage fails
    }
  }

  private async verifySessionState(state: string): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
      channelsLogger.debug(`🔍 Verifying Shopee session state from database: ${state}`);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Fetch state from database
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_state?state=eq.${state}&select=user_id,channel_name,expires_at`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        channelsLogger.error('❌ Database query failed:', response.status);
        return { valid: false, error: 'Database verification failed' };
      }

      const states = await response.json();
      
      if (states.length === 0) {
        channelsLogger.warn('❌ OAuth state not found in database');
        return { valid: false, error: 'OAuth state not found - session may have expired' };
      }

      const storedState = states[0];

      // Check if state has expired
      if (new Date(storedState.expires_at) < new Date()) {
        channelsLogger.warn('❌ OAuth state expired');
        // Clean up expired state
        await this.deleteExpiredState(state);
        return { valid: false, error: 'OAuth state expired - please try again' };
      }

      // Verify channel matches
      if (storedState.channel_name !== 'shopee') {
        channelsLogger.warn('❌ OAuth state channel mismatch');
        return { valid: false, error: 'OAuth state channel mismatch' };
      }

      channelsLogger.info(`✅ Verified OAuth state for shopee channel, user ${storedState.user_id}`);
      
      // State is valid - remove it to prevent reuse
      await this.deleteExpiredState(state);
      
      return { valid: true, userId: storedState.user_id };
    } catch (error) {
      channelsLogger.error('❌ Error verifying session state:', error);
      return { valid: false, error: 'Error verifying OAuth state' };
    }
  }

  private async deleteExpiredState(state: string): Promise<void> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      await fetch(`${supabaseUrl}/rest/v1/user_state?state=eq.${state}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      channelsLogger.info(`🗑️ Deleted expired state from database: ${state}`);
    } catch (error) {
      channelsLogger.error('❌ Error deleting expired state:', error);
    }
  }

  // Clean up expired states periodically
  private async cleanupExpiredStates(): Promise<void> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      await fetch(`${supabaseUrl}/rest/v1/user_state?expires_at=lt.${new Date().toISOString()}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      channelsLogger.info(`🧹 Cleaned up expired OAuth states from database`);
    } catch (error) {
      channelsLogger.error('❌ Error cleaning up expired states:', error);
    }
  }

  async getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}> {
    try {
      // Get shop_id and code from the tokenMap
      const shopId = tokenMap.get('shop_id');
      const code = tokenMap.get('code');
      
      if (!shopId || !code) {
        throw new Error('Missing shop_id or code in tokenMap');
      }

      // Prepare the request body
      const requestBody = {
        shop_id: parseInt(shopId),
        code: code
      };

      // Make the POST request using base method
      const tokenData = await this.makeAuthenticatedRequest(
        this.HOST,
        "/api/v2/auth/token/get",
        this.PARTNER_ID.toString(),
        (requestOptions) => {
          // Shopee uses HMAC-SHA256 with partner_id + path + timestamp
          const baseString = `${this.PARTNER_ID}${new URL(requestOptions.uri).pathname}${requestOptions.qs.timestamp}`;
          return crypto
            .createHmac('sha256', this.PARTNER_KEY)
            .update(baseString)
            .digest('hex');
        },
        'POST',
        {}, // No query params needed
        requestBody
      );
      
      channelsLogger.info(`✅ Successfully retrieved Shopee token for shop ${shopId}`);
      
      // Return both access token and refresh token
      return {
        access_token: tokenData.access_token || '',
        refresh_token: tokenData.refresh_token
      };
    } catch (error) {
      channelsLogger.error('❌ Error getting Shopee token:', error);
      throw error;
    }
  }

  // Override base class method to handle Shopee's shopId requirement
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
        
        if (!teamChannelConfig.shop_id) {
          channelsLogger.error(`❌ No shop_id available for ${this.channelName} refresh`);
          return null;
        }
        
        // Check if refresh token is still valid
        const refreshTokenExpiresAt = teamChannelConfig.refresh_token_expires_at ? new Date(teamChannelConfig.refresh_token_expires_at) : null;
        if (refreshTokenExpiresAt && refreshTokenExpiresAt.getTime() <= now.getTime()) {
          channelsLogger.error(`❌ ${this.channelName} refresh token has expired`);
          return null;
        }
        
        // Call Shopee-specific refresh method
        const tokenResponse = await this._refreshShopeeToken(teamChannelConfig.shop_id, teamChannelConfig.refresh_token);
        
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

  async refreshToken(refreshToken: string): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}> {
    throw new Error('Shopee refreshToken requires shopId. Use refreshTokenIfNeeded instead.');
  }

  private async _refreshShopeeToken(shopId: string, refreshToken: string): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}> {
    try {
      if (!shopId || !refreshToken) {
        throw new Error('Missing shop_id or refresh_token');
      }

      // Prepare the request body
      const requestBody = {
        partner_id: this.PARTNER_ID,
        shop_id: parseInt(shopId),
        refresh_token: refreshToken
      };

      // Make the POST request using base method
      const tokenData = await this.makeAuthenticatedRequest(
        this.HOST,
        "/api/v2/auth/access_token/get",
        this.PARTNER_ID.toString(),
        (requestOptions) => {
          // Shopee uses HMAC-SHA256 with partner_id + path + timestamp
          const baseString = `${this.PARTNER_ID}${new URL(requestOptions.uri).pathname}${requestOptions.qs.timestamp}`;
          return crypto
            .createHmac('sha256', this.PARTNER_KEY)
            .update(baseString)
            .digest('hex');
        },
        'POST',
        {}, // No query params needed
        requestBody
      );
      
      channelsLogger.info(`✅ Successfully refreshed Shopee token for shop ${shopId}`);
      
      // Return both new access token and refresh token
      return {
        access_token: tokenData.access_token || '',
        refresh_token: tokenData.refresh_token
      };
    } catch (error) {
      channelsLogger.error('❌ Error refreshing Shopee token:', error);
      throw error;
    }
  }

  // Override connectToDatabase to call getToken and save tokens
  protected async connectToDatabase(credentials: ChannelCredentials, userId: string): Promise<void> {
    try {
      // Get channel from database
      const channelData = await ChannelService.getChannelTypeByName(this.channelName);
      if (!channelData) {
        throw new Error(`Channel ${this.channelName} not found in database`);
      }

      let teamId: string;
      try {
        const userTeamId = await TeamUserService.getTeamIdByUserId(userId);
        teamId = userTeamId!;
      } catch (error) {
        channelsLogger.error(`Error getting team for user ${userId}:`, error);
        throw error;
      }

      // Call getToken API to get access and refresh tokens
      const tokenMap = new Map<string, string>();
      tokenMap.set('shop_id', credentials.shop_id || '');
      tokenMap.set('code', credentials.api_key || ''); // Shopee uses code as api_key
      
      channelsLogger.debug(`🔑 Calling Shopee getToken API for shop ${credentials.shop_id}`);
      const tokens = await this.getToken(tokenMap);
      
      // Update credentials with the retrieved tokens
      const updatedCredentials = {
        shop_id: credentials.shop_id,
        token: tokens.access_token,
        refresh_token: tokens.refresh_token
      };

      // Connect team to channel with tokens
      await ChannelsService.connectTeamToChannel(
        teamId,
        channelData.id,
        updatedCredentials
      );

      channelsLogger.info(`Successfully connected ${this.channelName} for user ${userId} in team ${teamId} with tokens`);
    } catch (error) {
      channelsLogger.error(`❌ Error in Shopee connectToDatabase:`, error);
      throw error;
    }
  }
}
