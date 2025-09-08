import crypto from 'crypto';

export interface TikTokShopConfig {
  host: string;
  appKey: string;
  appSecret: string;
  serviceId: string;
}

export interface TikTokShopRequestOptions {
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  qs?: Record<string, any>;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export interface TikTokShopProductSearchOptions {
  pageSize?: number;
  pageToken?: string;
  status?: 'ALL' | 'LIVE' | 'DRAFT' | 'DELETED';
  sellerSkus?: string[];
  createTimeGe?: number;
  createTimeLe?: number;
  updateTimeGe?: number;
  updateTimeLe?: number;
  categoryVersion?: string;
  listingQualityTiers?: ('POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT')[];
  listingPlatforms?: ('NEXT_PUBLIC_TIKTOK_SHOP' | 'SHOPIFY')[];
  auditStatus?: ('AUDITING' | 'APPROVED' | 'REJECTED')[];
  skuIds?: string[];
  returnDraftVersion?: boolean;
}

export interface TikTokShopProductGetOptions {
  returnUnderReviewVersion?: boolean;
  returnDraftVersion?: boolean;
}

export class TikTokShopApiClient {
  private config: TikTokShopConfig;
  private readonly excludeKeys = ["access_token", "sign"] as const;

  constructor(config: TikTokShopConfig) {
    this.config = config;
  }


  private generateSign(requestOption: TikTokShopRequestOptions): string {
    let signString = "";
    
    const params = requestOption.qs || {};
    const sortedParams = Object.keys(params)
      .filter((key) => !this.excludeKeys.includes(key as any))
      .sort()
      .map((key) => ({ key, value: params[key] }));
    
    const paramString = sortedParams
      .map(({ key, value }) => `${key}${value}`)
      .join("");
    
    signString += paramString;
    
    const pathname = new URL(requestOption.uri).pathname;
    
    signString = `${pathname}${paramString}`;
    
    if (
      requestOption.headers?.["content-type"] !== "multipart/form-data" &&
      requestOption.body &&
      Object.keys(requestOption.body).length
    ) {
      const body = JSON.stringify(requestOption.body);
      signString += body;
    }
    
    signString = `${this.config.appSecret}${signString}${this.config.appSecret}`;
    
    const hmac = crypto.createHmac("sha256", this.config.appSecret);
    hmac.update(signString);
    const sign = hmac.digest("hex");
    
    return sign;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    queryParams: Record<string, any> = {},
    body?: Record<string, any>,
    headers: Record<string, string> = {}
  ): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const uri = `${this.config.host}${endpoint}`;
      
      const baseParams: Record<string, any> = {
        app_key: this.config.appKey,
        timestamp: timestamp.toString(),
        ...queryParams
      };

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };

      const requestOptions: TikTokShopRequestOptions = {
        uri,
        method,
        qs: baseParams,
        headers: requestHeaders
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = body;
      }

      const sign = this.generateSign(requestOptions);
      requestOptions.qs!.sign = sign;

      const url = new URL(uri);
      if (requestOptions.qs) {
        Object.entries(requestOptions.qs).forEach(([key, value]) => {
          url.searchParams.append(key, value.toString());
        });
      }

      const fetchOptions: RequestInit = {
        method,
        headers: requestOptions.headers
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url.toString(), fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Shop API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`TikTok Shop API error: ${data.message || 'Unknown error'}`);
      }

      return data.data || data;
    } catch (error) {
      console.error('TikTok Shop API request failed:', error);
      throw error;
    }
  }
  
  async searchProducts(
    shopCipher: string,
    accessToken: string,
    options?: TikTokShopProductSearchOptions
  ): Promise<any[]> {
    const queryParams = {
      shop_cipher: shopCipher,
      page_size: options?.pageSize || 100,
      page_token: options?.pageToken || ''
    };

    const requestBody: Record<string, any> = {
      status: options?.status || 'ALL'
    };

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

    return await this.makeRequest(
      '/product/202502/products/search',
      'POST',
      queryParams,
      requestBody,
      accessToken ? { 'x-tts-access-token': accessToken } : {}
    );
  }

  async getProduct(
    productId: string,
    shopCipher: string,
    accessToken: string,
    options?: TikTokShopProductGetOptions
  ): Promise<any> {
    const queryParams: Record<string, any> = {
      shop_cipher: shopCipher
    };

    if (typeof options?.returnUnderReviewVersion === 'boolean') {
      queryParams.return_under_review_version = options.returnUnderReviewVersion;
    }

    if (typeof options?.returnDraftVersion === 'boolean') {
      queryParams.return_draft_version = options.returnDraftVersion;
    }

    return await this.makeRequest(
      `/product/202309/products/${productId}`,
      'GET',
      queryParams,
      undefined,
      accessToken ? { 'x-tts-access-token': accessToken } : {}
    );
  }

  async getToken(authCode: string): Promise<{access_token: string, refresh_token?: string}> {
    const tokenData = {
      app_key: this.config.appKey,
      auth_code: authCode,
      grant_type: 'authorized_code'
    };

    return await this.makeRequest(
      '/authorization/202309/token/get',
      'POST',
      {},
      tokenData
    );
  }

  async refreshToken(refreshToken: string): Promise<{access_token: string, refresh_token?: string}> {
    const tokenData = {
      app_key: this.config.appKey,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    return await this.makeRequest(
      '/authorization/202309/token/refresh',
      'POST',
      {},
      tokenData
    );
  }

}
