import { NextRequest, NextResponse } from "next/server";
import { addChannel } from "@/lib/channels-service";
import { ChannelRegistry, type Channel, type ChannelCredentials } from "../index";

export interface CallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  [key: string]: string | undefined;
}

export interface CallbackResult {
  success: boolean;
  channel?: Channel;
  error?: string;
  redirectUrl: string;
}

export abstract class BaseOAuthCallback {
  protected channelId: string;
  protected baseRedirectUrl: string;

  constructor(channelId: string, baseRedirectUrl: string = '/app/settings') {
    this.channelId = channelId;
    this.baseRedirectUrl = baseRedirectUrl;
  }

  abstract extractCredentials(params: CallbackParams): ChannelCredentials;
  abstract validateChannelSpecificParams(params: CallbackParams): { valid: boolean; error?: string };
  abstract getSuccessMessage(): string;
  async handleCallback(request: NextRequest): Promise<NextResponse> {
    try {
      const params = this.extractUrlParams(request);

      const oauthError = this.checkOAuthError(params);
      if (oauthError) {
        return this.createErrorRedirect(oauthError, request);
      }

      const paramValidation = this.validateRequiredParams(params);
      if (!paramValidation.valid) {
        return this.createErrorRedirect(paramValidation.error!, request);
      }

      const stateValidation = this.validateState(params, request);
      if (!stateValidation.valid) {
        return this.createErrorRedirect(stateValidation.error!, request);
      }

      const channelValidation = this.validateChannelSpecificParams(params);
      if (!channelValidation.valid) {
        return this.createErrorRedirect(channelValidation.error!, request);
      }

      const userId = this.extractUserIdFromState(params.state!);

      const connectionResult = await this.connectChannel(userId, params);
      
      if (connectionResult.success) {
        return this.createSuccessRedirect(request);
      } else {
        return this.createErrorRedirect(connectionResult.error!, request);
      }

    } catch (error) {
      console.error(`${this.channelId} OAuth callback error:`, error);
      return this.createErrorRedirect('Server error occurred', request);
    }
  }

  protected extractUrlParams(request: NextRequest): CallbackParams {
    const { searchParams } = new URL(request.url);
    const params: CallbackParams = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  protected checkOAuthError(params: CallbackParams): string | null {
    if (params.error) {
      const description = params.error_description || params.error;
      return `OAuth error: ${description}`;
    }
    return null;
  }

  protected validateRequiredParams(params: CallbackParams): { valid: boolean; error?: string } {
    if (!params.code) {
      return { valid: false, error: 'Missing authorization code' };
    }

    if (!params.state) {
      return { valid: false, error: 'Missing state parameter' };
    }

    return { valid: true };
  }

  protected validateState(params: CallbackParams, request: NextRequest): { valid: boolean; error?: string } {
    const cookies = request.headers.get('cookie') || '';
    const cookieMatch = cookies.match(new RegExp(`${this.channelId}_auth_state=([^;]+)`));
    const storedState = cookieMatch ? cookieMatch[1] : null;

    if (!storedState || storedState !== params.state) {
      return { valid: false, error: 'Invalid state parameter - security verification failed' };
    }

    return { valid: true };
  }

  protected extractUserIdFromState(state: string): string {
    const stateParts = state.split('.');
    return stateParts.length === 2 ? stateParts[1] : "1";
  }

  protected async connectChannel(userId: string, params: CallbackParams): Promise<{ success: boolean; error?: string }> {
    try {
      const channelDef = ChannelRegistry.getChannelDefinitionByName(this.channelId);
      if (!channelDef) {
        return { success: false, error: `Channel ${this.channelId} not found in registry` };
      }

      const credentials = this.extractCredentials(params);

      const validation = ChannelRegistry.validateCredentials(this.channelId, credentials);
      if (!validation.valid) {
        return { success: false, error: `Invalid credentials: missing ${validation.missing.join(', ')}` };
      }

      const { addChannelByName } = await import('../../channels-service');
      const result = await addChannelByName(userId, this.channelId, credentials);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };

    } catch (error) {
      console.error(`Error connecting ${this.channelId} channel:`, error);
      return { success: false, error: 'Failed to connect channel' };
    }
  }

  protected createSuccessRedirect(request: NextRequest): NextResponse {
    const successUrl = new URL(this.baseRedirectUrl, request.url);
    successUrl.searchParams.set('success', `${this.channelId}_connected`);
    successUrl.searchParams.set('success_message', this.getSuccessMessage());
    
    const response = NextResponse.redirect(successUrl);
    
    response.cookies.set(`${this.channelId}_auth_state`, '', { 
      maxAge: 0, 
      path: '/',
      secure: true,
      sameSite: 'strict'
    });

    return response;
  }

  protected createErrorRedirect(error: string, request: NextRequest): NextResponse {
    const errorUrl = new URL(this.baseRedirectUrl, request.url);
    errorUrl.searchParams.set('error', `${this.channelId}_error`);
    errorUrl.searchParams.set('error_message', `${this.channelId} authentication failed: ${error}`);
    
    const response = NextResponse.redirect(errorUrl);
    
    response.cookies.set(`${this.channelId}_auth_state`, '', { 
      maxAge: 0, 
      path: '/',
      secure: true,
      sameSite: 'strict'
    });

    return response;
  }
}
