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
      requiredFields: ['code']
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
    
    // Store state in session for verification during callback
    await this.storeSessionState(state, params.userId, 'tiktok');
    
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

    // Generate PKCE parameters
    const { codeChallenge, codeVerifier } = this.generatePKCEParams();
    
    // Store code verifier for later use during token exchange
    await this.storeCodeVerifier(state, codeVerifier);
    
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
      if (!global.oauthStates) {
        return null;
      }
      
      const stateData = global.oauthStates.get(state);
      if (stateData && stateData.codeVerifier) {
        return stateData.codeVerifier;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving code verifier:', error);
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
      if (storedState.channelName !== 'tiktok') {
        return { valid: false, error: 'OAuth state channel mismatch' };
      }

      // State is valid - remove it to prevent reuse
      global.oauthStates.delete(state);
      
      console.log(`Verified OAuth state for tiktok channel, user ${storedState.userId}`);
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
