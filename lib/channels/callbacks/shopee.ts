import { BaseOAuthCallback, type CallbackParams } from './base';
import { type ChannelCredentials } from '../types';

export class ShopeeOAuthCallback extends BaseOAuthCallback {
  constructor() {
    super('shopee');
  }

  extractCredentials(params: CallbackParams): ChannelCredentials {
    return {
      shopId: params.shop_id || '',
      apiKey: params.code || '',
    };
  }

  validateChannelSpecificParams(params: CallbackParams): { valid: boolean; error?: string } {
    if (!params.shop_id) {
      return { valid: false, error: 'Missing shop_id parameter' };
    }
    
    return { valid: true };
  }

  getSuccessMessage(): string {
    return 'Shopee account successfully connected!';
  }

  protected validateRequiredParams(params: CallbackParams): { valid: boolean; error?: string } {
    const baseValidation = super.validateRequiredParams(params);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    if (!params.shop_id) {
      return { valid: false, error: 'Missing required shop_id parameter' };
    }

    return { valid: true };
  }
}
