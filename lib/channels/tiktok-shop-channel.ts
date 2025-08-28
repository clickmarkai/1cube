/**
 * TikTok Shop Channel Implementation
 * Concrete implementation of BaseChannel for TikTok Shop marketplace
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

export class TikTokShopChannel extends BaseChannel {
  private readonly HOST = process.env.TIKTOK_SHOP_HOST || "https://open-api.tiktokglobalshop.com";
  private readonly APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "";
  private readonly APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "";
  private readonly SERVICE_ID = process.env.TIKTOK_SHOP_SERVICE_ID || "7542438678683289352";

  constructor() {
    const config: ChannelConfig = {
      name: 'TikTok Shop',
      description: 'TikTok\'s e-commerce platform for selling products directly on TikTok',
      requiredFields: ['shop_id', 'api_key']
    };

    super('tiktok-shop', config);
  }

  extractCredentials(params: Record<string, string>): ChannelCredentials {
    return {
      api_key: params.code
    };
  }

  async validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }> {
        // Check for OAuth errors first
    if (params.error) {
      const errorMsg = params.error_description || params.error;
      return { valid: false, error: `TikTok OAuth error: ${errorMsg}` };
    }

    // Validate required authorization code
    if (!params.code) {
      return { valid: false, error: 'Missing authorization code from TikTok OAuth' };
    }

    // Validate state parameter exists (security check)
    if (!params.state) {
      return { valid: false, error: 'Missing state parameter for OAuth security validation' };
    }

    // Verify OAuth state parameter for security
    const stateVerification = await this.verifySessionState(params.state);
    if (!stateVerification.valid) {
      return { valid: false, error: stateVerification.error || 'Invalid OAuth state for TikTok' };
    }

    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    // TODO: Implement TikTok Shop OAuth link generation
    const state = this.generateState(params.userId);
    const authLink = 'https://services.tiktokshop.com/open/authorize?service_id=' + this.SERVICE_ID;
    
    await this.storeSessionState(state, params.userId, 'tiktok-shop');

    return { authLink, state };
  }

  // TikTok Shop-specific methods
  async sync(): Promise<void> {
    // TODO: Implement TikTok Shop-specific sync logic
    console.log(`Syncing ${this.getName()} data...`);
  }

  async getProducts(): Promise<any[]> {
    // TODO: Implement TikTok Shop-specific product fetching
    console.log(`Fetching products from ${this.getName()}...`);
    return [];
  }

  async getOrders(): Promise<any[]> {
    // TODO: Implement TikTok Shop-specific order fetching
    console.log(`Fetching orders from ${this.getName()}...`);
    return [];
  }

  // Additional TikTok Shop-specific methods
  async getShopInfo(): Promise<any> {
    // TODO: Implement TikTok Shop info fetching
    console.log(`Fetching shop info from ${this.getName()}...`);
    return {};
  }

  async getCategories(): Promise<any[]> {
    // TODO: Implement TikTok Shop categories fetching
    console.log(`Fetching categories from ${this.getName()}...`);
    return [];
  }

  async createProduct(productData: any): Promise<any> {
    // TODO: Implement TikTok Shop product creation
    console.log(`Creating product on ${this.getName()}...`);
    return null;
  }

  async updateProduct(productId: string, productData: any): Promise<any> {
    // TODO: Implement TikTok Shop product update
    console.log(`Updating product ${productId} on ${this.getName()}...`);
    return null;
  }

  async getInventory(): Promise<any[]> {
    // TODO: Implement TikTok Shop inventory fetching
    console.log(`Fetching inventory from ${this.getName()}...`);
    return [];
  }

  async updateInventory(inventoryData: any): Promise<any> {
    // TODO: Implement TikTok Shop inventory update
    console.log(`Updating inventory on ${this.getName()}...`);
    return null;
  }

  async getPromotions(): Promise<any[]> {
    // TODO: Implement TikTok Shop promotions fetching
    console.log(`Fetching promotions from ${this.getName()}...`);
    return [];
  }

  async createPromotion(promotionData: any): Promise<any> {
    // TODO: Implement TikTok Shop promotion creation
    console.log(`Creating promotion on ${this.getName()}...`);
    return null;
  }

  async getAnalytics(): Promise<any> {
    // TODO: Implement TikTok Shop analytics fetching
    console.log(`Fetching analytics from ${this.getName()}...`);
    return {};
  }

  async getCustomers(): Promise<any[]> {
    // TODO: Implement TikTok Shop customers fetching
    console.log(`Fetching customers from ${this.getName()}...`);
    return [];
  }

  async getShipping(): Promise<any[]> {
    // TODO: Implement TikTok Shop shipping info fetching
    console.log(`Fetching shipping info from ${this.getName()}...`);
    return [];
  }

  async updateShipping(shippingData: any): Promise<any> {
    // TODO: Implement TikTok Shop shipping update
    console.log(`Updating shipping on ${this.getName()}...`);
    return null;
  }

  // Database-based session state storage methods
  private async storeSessionState(state: string, userId: string, channelName: string): Promise<void> {
    try {
      console.log(`📦 Storing TikTok Shop session state in DB - State: ${state}, UserId: ${userId}, Channel: ${channelName}`);
      
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
          code_verifier: null // TikTok Shop doesn't use PKCE initially
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
      console.log(`🔍 Verifying TikTok Shop session state from database: ${state}`);
      
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
      if (storedState.channel_name !== 'tiktok-shop') {
        console.log('❌ OAuth state channel mismatch');
        return { valid: false, error: 'OAuth state channel mismatch' };
      }

      console.log(`✅ Verified OAuth state for tiktok-shop channel, user ${storedState.user_id}`);
      
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

  // PKCE methods for OAuth security
  private generatePKCEParams(): { codeChallenge: string; codeVerifier: string } {
    // TODO: Implement PKCE parameter generation for TikTok Shop
    const codeVerifier = '';
    const codeChallenge = '';
    return { codeChallenge, codeVerifier };
  }

  private async storeCodeVerifier(state: string, codeVerifier: string): Promise<void> {
    // TODO: Implement code verifier storage for TikTok Shop
    console.log(`Storing code verifier for TikTok Shop state: ${state}`);
  }

  private async getCodeVerifier(state: string): Promise<string | null> {
    // TODO: Implement code verifier retrieval for TikTok Shop
    console.log(`Retrieving code verifier for TikTok Shop state: ${state}`);
    return null;
  }
}
