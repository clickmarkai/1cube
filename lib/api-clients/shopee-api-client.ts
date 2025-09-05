import crypto from 'crypto';

export interface ShopeeConfig {
  host: string;
  partnerId: number;
  partnerKey: string;
}

export interface ShopeeProductSearchOptions {
  pageSize?: number;
  itemStatus?: 'NORMAL' | 'SELLER_DELETE' | 'BANNED' | 'UNLIST' | 'SHOPEE_DELETE' | 'REVIEWING';
  updateTimeFrom?: number;
  updateTimeTo?: number;
}

export interface ShopeeProductDetailsOptions {
  needTaxInfo?: boolean;
  needComplaintPolicy?: boolean;
}

export class ShopeeApiClient {
  private config: ShopeeConfig;

  constructor(config: ShopeeConfig) {
    this.config = config;
  }

  private generateSignature(apiPath: string, timestamp: number): string {
    const baseString = `${this.config.partnerId}${apiPath}${timestamp}`;
    return crypto
      .createHmac('sha256', this.config.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  private async makeRequest(
    apiPath: string,
    method: 'GET' | 'POST' = 'GET',
    queryParams: Record<string, any> = {},
    body?: Record<string, any>
  ): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateSignature(apiPath, timestamp);

      const params = new URLSearchParams({
        partner_id: this.config.partnerId.toString(),
        sign: signature,
        timestamp: timestamp.toString(),
        ...queryParams
      });

      const url = `${this.config.host}${apiPath}?${params.toString()}`;

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (body && method === 'POST') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`Shopee API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Shopee API error: ${data.error} - ${data.message}`);
      }

      return data;
    } catch (error) {
      console.error('Shopee API request failed:', error);
      throw error;
    }
  }

  async getItemList(
    shopId: string,
    accessToken: string,
    options?: ShopeeProductSearchOptions & { offset?: number }
  ): Promise<any> {
    const queryParams: Record<string, any> = {
      shop_id: shopId,
      access_token: accessToken,
      offset: (options?.offset || 0).toString(),
      page_size: (options?.pageSize || 100).toString(),
      item_status: options?.itemStatus || 'NORMAL'
    };

    if (options?.updateTimeFrom) {
      queryParams.update_time_from = options.updateTimeFrom.toString();
    }
    if (options?.updateTimeTo) {
      queryParams.update_time_to = options.updateTimeTo.toString();
    }

    return await this.makeRequest(
      "/api/v2/product/get_item_list",
      'GET',
      queryParams
    );
  }

  async getItemBaseInfo(
    shopId: string,
    accessToken: string,
    itemIds: number[],
    options?: ShopeeProductDetailsOptions
  ): Promise<any> {
    const queryParams: Record<string, any> = {
      shop_id: shopId,
      access_token: accessToken,
      item_id_list: itemIds.join(','),
      need_tax_info: (options?.needTaxInfo ?? true).toString(),
      need_complaint_policy: (options?.needComplaintPolicy ?? true).toString()
    };

    return await this.makeRequest(
      "/api/v2/product/get_item_base_info",
      'GET',
      queryParams
    );
  }

  async getToken(shopId: string, code: string): Promise<{access_token: string, refresh_token?: string}> {
    const requestBody = {
      shop_id: parseInt(shopId),
      code: code
    };

    return await this.makeRequest(
      "/api/v2/auth/token/get",
      'POST',
      {},
      requestBody
    );
  }

  async getAccessToken(shopId: string, refreshToken: string): Promise<any> {
    const requestBody = {
      partner_id: this.config.partnerId,
      shop_id: parseInt(shopId),
      refresh_token: refreshToken
    };

    return await this.makeRequest(
      "/api/v2/auth/access_token/get",
      'POST',
      {},
      requestBody
    );
  }
}
