/**
 * TikTok Channel Implementation
 * Concrete implementation of BaseChannel for TikTok marketplace
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

export class TikTokChannel extends BaseChannel {
  private readonly HOST = process.env.TIKTOK_HOST || "https://business-api.tiktok.com";
  private readonly APP_ID = process.env.TIKTOK_APP_ID || "";
  private readonly APP_SECRET = process.env.TIKTOK_APP_SECRET || "";
  private readonly CLIENT_KEY = "sbawbjuuq7qev3vci3";

  constructor() {
    const config: ChannelConfig = {
      name: 'TikTok',
      description: 'Global platform for short-form video content and shopping',
      requiredFields: []
    };

    super('tiktok', config);
  }

  extractCredentials(params: Record<string, string>): ChannelCredentials {
    return {
      api_key: params.code, // TikTok authorization code from OAuth
      api_secret: params.scopes, // Store granted scopes as api_secret for reference
      shop_id: params.state // Store state for OAuth validation
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

    // Validate scopes were granted
    if (!params.scopes) {
      console.warn('No scopes returned from TikTok OAuth - this may indicate limited permissions');
    }

    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);

    console.log(`🔗 TikTok generateAuthLink - State: ${state}, UserId: ${params.userId}`);

    // Generate PKCE parameters first
    const { codeChallenge, codeVerifier } = this.generatePKCEParams();

    // Store state with code verifier in one operation for better reliability
    await this.storeSessionStateWithVerifier(state, params.userId, 'tiktok', codeVerifier);

    // Default scopes for TikTok API access
    const defaultScopes = [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
      'video.upload'
    ];

    const scopes = params.scopes && params.scopes.length > 0 ? params.scopes : defaultScopes;
    const scopeString = scopes.join(',');

    // TikTok OAuth authorization URL
    const authLink =
      'https://www.tiktok.com/v2/auth/authorize/?' +
      `client_key=${this.CLIENT_KEY}&` +
      'response_type=code&' +
      // `scope=${encodeURIComponent(scopeString)}&` +
      'scope=user.info.basic&' +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;

    // Verify the state was stored correctly in database
    const verification = await this.verifySessionState(state);
    if (!verification.valid) {
      throw new Error(`❌ Failed to store session state in database - OAuth link generation failed: ${verification.error}`);
    }

    console.log('✅ TikTok auth link generated successfully with stored state');
    return { authLink, state };
  }

  private generatePKCEParams(): { codeChallenge: string; codeVerifier: string } {
    // Step 1: Generate code verifier (random string)
    const codeVerifier = crypto.randomBytes(32).toString("hex");

    // Step 2: Generate code challenge (base64url encoded SHA256 hash of code verifier)
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

  // Debug method to test session state storage
  public async testSessionStateStorage(userId: string): Promise<{ success: boolean; details: string }> {
    try {
      const testState = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testVerifier = 'test_verifier_' + Date.now();

      console.log('🧪 Testing session state storage...');

      // Test storage
      await this.storeSessionStateWithVerifier(testState, userId, 'tiktok', testVerifier);

      // Test retrieval
      const retrieved = global.oauthStates?.get(testState);
      if (!retrieved) {
        return { success: false, details: 'Failed to retrieve stored state' };
      }

      // Test code verifier retrieval
      const retrievedVerifier = await this.getCodeVerifier(testState);
      if (retrievedVerifier !== testVerifier) {
        return { success: false, details: 'Code verifier mismatch' };
      }

      // Test verification
      const verification = await this.verifySessionState(testState);
      if (!verification.valid) {
        return { success: false, details: 'State verification failed: ' + verification.error };
      }

      console.log('✅ Session state storage test passed');
      return { success: true, details: 'All tests passed' };
    } catch (error) {
      console.error('❌ Session state storage test failed:', error);
      return { success: false, details: 'Exception: ' + (error as Error).message };
    }
  }

  private async storeCodeVerifier(state: string, codeVerifier: string): Promise<void> {
    try {
      if (!global.oauthStates) {
        global.oauthStates = new Map();
      }

      // Get existing state data or create new
      const existingState = global.oauthStates.get(state);
      if (existingState) {
        // Update existing state with code verifier
        existingState.codeVerifier = codeVerifier;
        global.oauthStates.set(state, existingState);
      } else {
        console.warn(`State ${state} not found when trying to store code verifier`);
      }

      console.log(`Stored PKCE code verifier for state ${state}`);
    } catch (error) {
      console.error('Error storing code verifier:', error);
    }
  }

  private async getCodeVerifier(state: string): Promise<string | null> {
    try {
      console.log(`🔑 Retrieving code verifier for state: ${state}`);

      if (!global.oauthStates) {
        console.log('❌ No global OAuth states found');
        return null;
      }

      const stateData = global.oauthStates.get(state);
      if (stateData && stateData.codeVerifier) {
        console.log('✅ Code verifier found');
        return stateData.codeVerifier;
      }

      console.log('❌ Code verifier not found for state');
      return null;
    } catch (error) {
      console.error('❌ Error retrieving code verifier:', error);
      return null;
    }
  }

  // Additional TikTok-specific methods
  async sync(): Promise<void> {
    // TODO: Implement TikTok-specific sync logic
    console.log(`Syncing ${this.getName()} data...`);
  }

  async getProducts(): Promise<any[]> {
    // TODO: Implement TikTok-specific product fetching
    console.log(`Fetching products from ${this.getName()}...`);
    return [];
  }

  async getOrders(): Promise<any[]> {
    // TODO: Implement TikTok-specific order fetching
    console.log(`Fetching orders from ${this.getName()}...`);
    return [];
  }

  // Additional TikTok-specific methods can be added here
  async getVideos(): Promise<any[]> {
    // TODO: Implement TikTok video content fetching
    console.log(`Fetching videos from ${this.getName()}...`);
    return [];
  }

  async getAnalytics(): Promise<any> {
    // TODO: Implement TikTok analytics data fetching
    console.log(`Fetching analytics from ${this.getName()}...`);
    return {};
  }

  async createAd(adData: any): Promise<any> {
    // TODO: Implement TikTok ad creation
    console.log(`Creating ad on ${this.getName()}...`);
    return null;
  }

  async getAdCampaigns(): Promise<any[]> {
    // TODO: Implement TikTok ad campaigns fetching
    console.log(`Fetching ad campaigns from ${this.getName()}...`);
    return [];
  }

  // Database-based session state and code verifier storage
  private async storeSessionStateWithVerifier(state: string, userId: string, channelName: string, codeVerifier: string): Promise<void> {
    try {
      console.log(`📦 Storing TikTok session state in DB - State: ${state}, UserId: ${userId}, Channel: ${channelName}`);

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
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Database storage failed: ${response.status} ${error}`);
      }

      console.log(`✅ Stored OAuth state for ${channelName} channel, user ${userId} in database`);
    } catch (error) {
      console.error('❌ Error storing session state in database:', error);
      throw error; // Re-throw to prevent auth link generation if storage fails
    }
  }

  // Session state management for OAuth security (legacy method, keeping for compatibility)
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

      // Clean up expired states in database
      await this.cleanupExpiredStates();

      console.log(`Stored OAuth state for ${channelName} channel, user ${userId}`);
    } catch (error) {
      console.error('Error storing session state:', error);
    }
  }

  private async verifySessionState(state: string): Promise<{ valid: boolean; error?: string; userId?: string }> {
    try {
      console.log(`🔍 Verifying TikTok session state from database: ${state}`);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Fetch state from database
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_state?state=eq.${state}&select=user_id,channel_name,expires_at,code_verifier`, {
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
      if (storedState.channel_name !== 'tiktok') {
        console.log('❌ OAuth state channel mismatch');
        return { valid: false, error: 'OAuth state channel mismatch' };
      }

      console.log(`✅ Verified OAuth state for tiktok channel, user ${storedState.user_id}`);

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
