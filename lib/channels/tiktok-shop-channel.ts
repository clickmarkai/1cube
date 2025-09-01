/**
 * TikTok Shop Channel Implementation
 * Concrete implementation of BaseChannel for TikTok Shop marketplace
 */

import crypto from 'crypto';
import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "../channel-base";

// TikTok Shop API request options interface
interface TikTokShopRequestOptions {
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  qs?: Record<string, any>;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

// TikTok Shop Product Search Options interface
interface TikTokShopProductSearchOptions {
  pageSize?: number;
  pageToken?: string;
  status?: 'ALL' | 'LIVE' | 'DRAFT' | 'DELETED';
  sellerSkus?: string[];
  createTimeGe?: number; // Unix timestamp
  createTimeLe?: number; // Unix timestamp
  updateTimeGe?: number; // Unix timestamp
  updateTimeLe?: number; // Unix timestamp
  categoryVersion?: string;
  listingQualityTiers?: ('POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT')[];
  listingPlatforms?: ('TIKTOK_SHOP' | 'SHOPIFY')[];
  auditStatus?: ('AUDITING' | 'APPROVED' | 'REJECTED')[];
  skuIds?: string[];
  returnDraftVersion?: boolean;
}

// TikTok Shop Single Product Get Options interface
interface TikTokShopProductGetOptions {
  returnUnderReviewVersion?: boolean;
  returnDraftVersion?: boolean;
}

// Sign generation for TikTok Shop API requests
const excludeKeys = ["access_token", "sign"] as const;

export const generateSign = (
  requestOption: TikTokShopRequestOptions,
  app_secret: string
) => {
  let signString = "";
  // step1: Extract all query parameters excluding sign and access_token. Reorder the parameter keys in alphabetical order:
  const params = requestOption.qs || {};
  const sortedParams = Object.keys(params)
    .filter((key) => !excludeKeys.includes(key as any))
    .sort()
    .map((key) => ({ key, value: params[key] }));
  
  //step2: Concatenate all the parameters in the format {key}{value}:
  const paramString = sortedParams
    .map(({ key, value }) => `${key}${value}`)
    .join("");
  
  signString += paramString;
  
  //step3: Append the string from Step 2 to the API request path:
  const pathname = new URL(requestOption.uri).pathname;
  
  signString = `${pathname}${paramString}`;
  
  //step4: If the request header content-type is not multipart/form-data, append the API request body to the string from Step 3:
  if (
    requestOption.headers?.["content-type"] !== "multipart/form-data" &&
    requestOption.body &&
    Object.keys(requestOption.body).length
  ) {
    const body = JSON.stringify(requestOption.body);
    signString += body;
  }
  
  //step5: Wrap the string generated in Step 4 with the app_secret:
  signString = `${app_secret}${signString}${app_secret}`;
  
  //step6: Encode your wrapped string using HMAC-SHA256:
  const hmac = crypto.createHmac("sha256", app_secret);
  hmac.update(signString);
  const sign = hmac.digest("hex");
  
  return sign;
};

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
      requiredFields: []
    };

    super('tiktok shop', config);
  }

  extractCredentials(params: Record<string, string>): ChannelCredentials {
    return {
      shop_id: params.app_key,
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
    
    await this.storeSessionState(state, params.userId, 'tiktok shop');

    return { authLink, state };
  }

  private async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    accessToken?: string,
    queryParams: Record<string, any> = {},
    body?: Record<string, any>,
    apiVersion: string = '202502'
  ): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const uri = `${this.HOST}${endpoint}`;
      
      const baseParams: Record<string, any> = {
        app_key: this.APP_KEY,
        timestamp: timestamp.toString(),
        ...queryParams
      };

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add access token to headers if provided
      if (accessToken) {
        headers['x-tts-access-token'] = accessToken;
      }

      // Prepare request options for sign generation
      const requestOptions: TikTokShopRequestOptions = {
        uri,
        method,
        qs: baseParams,
        headers
      };

      // Add body if provided
      if (body && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = body;
      }

      // Generate signature
      const sign = generateSign(requestOptions, this.APP_SECRET);
      requestOptions.qs!.sign = sign;

      // Build the final URL with query parameters
      const url = new URL(uri);
      if (requestOptions.qs) {
        Object.entries(requestOptions.qs).forEach(([key, value]) => {
          url.searchParams.append(key, value.toString());
        });
      }

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: requestOptions.headers
      };

      // Add body for POST/PUT requests
      if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
      }

      // Make the API request
      const response = await fetch(url.toString(), fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Shop API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Check for API-level errors
      if (data.code !== 0) {
        throw new Error(`TikTok Shop API error: ${data.message || 'Unknown error'}`);
      }

      return data.data || data;
    } catch (error) {
      console.error('TikTok Shop API request failed:', error);
      throw error;
    }
  }

  // TikTok Shop-specific methods
  async sync(): Promise<void> {
    // TODO: Implement TikTok Shop-specific sync logic
    console.log(`Syncing ${this.getName()} data...`);
  }

  async getProducts(shopCipher: string, accessToken: string, options?: TikTokShopProductSearchOptions): Promise<any[]> {
    try {
      // Query parameters for the URL
      const queryParams = {
        shop_cipher: shopCipher,
        page_size: options?.pageSize || 100,
        page_token: options?.pageToken || ''
      };

      // Request body with all the search criteria
      const requestBody: Record<string, any> = {
        status: options?.status || 'ALL'
      };

      // Add optional search parameters to the request body
      if (options?.sellerSkus && Array.isArray(options.sellerSkus)) {
        requestBody.seller_skus = options.sellerSkus;
      }

      if (options?.createTimeGe) {
        requestBody.create_time_ge = options.createTimeGe;
      }

      if (options?.createTimeLe) {
        requestBody.create_time_le = options.createTimeLe;
      }

      if (options?.updateTimeGe) {
        requestBody.update_time_ge = options.updateTimeGe;
      }

      if (options?.updateTimeLe) {
        requestBody.update_time_le = options.updateTimeLe;
      }

      if (options?.categoryVersion) {
        requestBody.category_version = options.categoryVersion;
      }

      if (options?.listingQualityTiers && Array.isArray(options.listingQualityTiers)) {
        requestBody.listing_quality_tiers = options.listingQualityTiers;
      }

      if (options?.listingPlatforms && Array.isArray(options.listingPlatforms)) {
        requestBody.listing_platforms = options.listingPlatforms;
      }

      if (options?.auditStatus && Array.isArray(options.auditStatus)) {
        requestBody.audit_status = options.auditStatus;
      }

      if (options?.skuIds && Array.isArray(options.skuIds)) {
        requestBody.sku_ids = options.skuIds;
      }

      if (typeof options?.returnDraftVersion === 'boolean') {
        requestBody.return_draft_version = options.returnDraftVersion;
      }

      const response = await this.makeAuthenticatedRequest(
        '/product/202502/products/search',
        'POST',
        accessToken,
        queryParams,
        requestBody
      );

      console.log(`Successfully fetched ${response.products?.length || 0} products from ${this.getName()}`);
      return response.products || [];
    } catch (error) {
      console.error(`Error fetching products from ${this.getName()}:`, error);
      throw error;
    }
  }

  async getProduct(productId: string, shopCipher: string, accessToken: string, options?: TikTokShopProductGetOptions): Promise<any> {
    try {
      // Query parameters for the URL
      const queryParams: Record<string, any> = {
        shop_cipher: shopCipher
      };

      // Add optional parameters
      if (typeof options?.returnUnderReviewVersion === 'boolean') {
        queryParams.return_under_review_version = options.returnUnderReviewVersion;
      }

      if (typeof options?.returnDraftVersion === 'boolean') {
        queryParams.return_draft_version = options.returnDraftVersion;
      }

      const response = await this.makeAuthenticatedRequest(
        `/product/202309/products/${productId}`,
        'GET',
        accessToken,
        queryParams,
        undefined, // No body for GET request
        '202309' // API version for single product endpoint
      );

      console.log(`Successfully fetched product ${productId} from ${this.getName()}`);
      return response.product || response;
    } catch (error) {
      console.error(`Error fetching product ${productId} from ${this.getName()}:`, error);
      throw error;
    }
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
      if (storedState.channel_name !== 'tiktok shop') {
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

  async getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string}> {
    try {
      const authCode = tokenMap.get('code');
      if (!authCode) {
        throw new Error('Authorization code is required for TikTok Shop token exchange');
      }

      const tokenData = {
        app_key: this.APP_KEY,
        auth_code: authCode,
        grant_type: 'authorized_code'
      };

      const response = await this.makeAuthenticatedRequest(
        '/authorization/202309/token/get',
        'POST',
        undefined, // No access token needed for token exchange
        {},
        tokenData
      );

      console.log(`Successfully obtained access token from ${this.getName()}`);
      
      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token
      };
    } catch (error) {
      console.error(`Error getting token from ${this.getName()}:`, error);
      throw error;
    }
  }
}
