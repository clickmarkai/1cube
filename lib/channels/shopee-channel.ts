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

  // Database-based session state storage  
  private async storeSessionState(state: string, userId: string, channelName: string): Promise<void> {
    try {
      console.log(`📦 Storing Shopee session state in DB - State: ${state}, UserId: ${userId}, Channel: ${channelName}`);
      
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
      
      console.log(`✅ Stored OAuth state for ${channelName} channel, user ${userId} in database`);
    } catch (error) {
      console.error('❌ Error storing session state in database:', error);
      throw error; // Re-throw to prevent auth link generation if storage fails
    }
  }

  private async verifySessionState(state: string): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
      console.log(`🔍 Verifying Shopee session state from database: ${state}`);
      
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
        console.error('❌ Database query failed:', response.status);
        return { valid: false, error: 'Database verification failed' };
      }

      const states = await response.json();
      
      if (states.length === 0) {
        console.log('❌ OAuth state not found in database');
        return { valid: false, error: 'OAuth state not found - session may have expired' };
      }

      const storedState = states[0];

      // Check if state has expired
      if (new Date(storedState.expires_at) < new Date()) {
        console.log('❌ OAuth state expired');
        // Clean up expired state
        await this.deleteExpiredState(state);
        return { valid: false, error: 'OAuth state expired - please try again' };
      }

      // Verify channel matches
      if (storedState.channel_name !== 'shopee') {
        console.log('❌ OAuth state channel mismatch');
        return { valid: false, error: 'OAuth state channel mismatch' };
      }

      console.log(`✅ Verified OAuth state for shopee channel, user ${storedState.user_id}`);
      
      // State is valid - remove it to prevent reuse
      await this.deleteExpiredState(state);
      
      return { valid: true, userId: storedState.user_id };
    } catch (error) {
      console.error('❌ Error verifying session state:', error);
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
      
      console.log(`🗑️ Deleted expired state from database: ${state}`);
    } catch (error) {
      console.error('❌ Error deleting expired state:', error);
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
      
      console.log(`🧹 Cleaned up expired OAuth states from database`);
    } catch (error) {
      console.error('❌ Error cleaning up expired states:', error);
    }
  }
}
