/**
 * Shopee Channel Implementation
 * Concrete implementation of BaseChannel for Shopee marketplace
 */

import crypto from 'crypto';
import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "../channel-base";

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

  validateSpecificParams(params: Record<string, string>): { valid: boolean; error?: string } {
    if (!params.shop_id) {
      return { valid: false, error: 'Missing shop_id parameter' };
    }

    if (!params.code) {
      return { valid: false, error: 'Missing authorization code' };
    }

    return { valid: true };
  }

  generateAuthLink(params: AuthLinkParams): AuthLinkResult {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiPath = "/api/v2/shop/auth_partner";

    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);
    const redirectUriWithState = `${redirectUri}?state=${state}`;

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
}
