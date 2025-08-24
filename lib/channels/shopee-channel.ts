/**
 * Shopee Channel Implementation
 * Concrete implementation of BaseChannel for Shopee marketplace
 */

import crypto from 'crypto';
import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "../channel-base";

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
    console.log(`Syncing ${this.getName()} data...`);
    // TODO: Implement Shopee-specific sync logic
  }

  async getProducts(): Promise<any[]> {
    console.log(`Fetching products from ${this.getName()}...`);
    // TODO: Implement Shopee-specific product fetching
    return [];
  }

  async getOrders(): Promise<any[]> {
    console.log(`Fetching orders from ${this.getName()}...`);
    // TODO: Implement Shopee-specific order fetching
    return [];
  }

  // Session state management for OAuth security
  private async storeSessionState(state: string, userId: string, channelName: string): Promise<void> {
    try {
      // Store state in a temporary in-memory store with timestamp
      // In production, you might want to use Redis or database
      const stateData = {
        state,
        userId,
        channelName,
        timestamp: Date.now()
      };

      // Use a simple in-memory storage for now (should be replaced with persistent storage)
      if (!global.oauthStates) {
        global.oauthStates = new Map();
      }
      
      global.oauthStates.set(state, stateData);
      
      // Clean up old states (older than 10 minutes)
      this.cleanupOldStates();
      
      console.log(`Stored OAuth state for ${channelName} channel, user ${userId}`);
    } catch (error) {
      console.error('Error storing session state:', error);
    }
  }

  private async verifySessionState(state: string): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
      if (!global.oauthStates) {
        return { valid: false, error: 'OAuth state storage not initialized' };
      }

      const storedState = global.oauthStates.get(state);
      
      if (!storedState) {
        return { valid: false, error: 'OAuth state not found - session may have expired' };
      }

      // Check if state has expired (10 minutes)
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      if (storedState.timestamp < tenMinutesAgo) {
        global.oauthStates.delete(state);
        return { valid: false, error: 'OAuth state expired - please try again' };
      }

      // Verify channel matches
      if (storedState.channelName !== 'shopee') {
        return { valid: false, error: 'OAuth state channel mismatch' };
      }

      // State is valid - remove it to prevent reuse
      global.oauthStates.delete(state);
      
      console.log(`Verified OAuth state for shopee channel, user ${storedState.userId}`);
      return { valid: true, userId: storedState.userId };
    } catch (error) {
      console.error('Error verifying session state:', error);
      return { valid: false, error: 'Error verifying OAuth state' };
    }
  }

  private cleanupOldStates(): void {
    if (!global.oauthStates) return;
    
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    
    for (const [state, data] of global.oauthStates.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        global.oauthStates.delete(state);
      }
    }
  }
}
