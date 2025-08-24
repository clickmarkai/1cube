/**
 * Abstract Channel Base Class
 * Acts like an interface in Java - defines the contract for all channel implementations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth.config";
import { ChannelsService } from "./channels-service";
import { ChannelService } from "./channel";
import { TeamUserService } from "./team-user";

export interface ChannelCredentials {
  shop_id?: string;
  api_key?: string;
  api_secret?: string;
}

export interface ChannelConfig {
  name: string;
  description: string;
  requiredFields: string[];
}

export interface AuthLinkResult {
  authLink: string;
  state: string;
}

export interface AuthLinkParams {
  userId: string;
  redirectUri?: string;
  scopes?: string[];
  additionalParams?: Record<string, string>;
}

// Default team ID fallback (if user not in any team)
const DEFAULT_TEAM_ID = "4aaa07c6-8291-441d-bcf6-1b6621bb27d1";

export abstract class BaseChannel {
  protected channelName: string;
  protected config: ChannelConfig;

  constructor(channelName: string, config: ChannelConfig) {
    this.channelName = channelName;
    this.config = config;
  }

  // Abstract methods - must be implemented by concrete classes
  abstract extractCredentials(params: Record<string, string>): ChannelCredentials;
  abstract validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }>;
  
  // Auth methods
  abstract generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult>;
  
  // Additional abstract methods for channel operations
  abstract sync(): Promise<void>;
  abstract getProducts(): Promise<any[]>;
  abstract getOrders(): Promise<any[]>;

  // Concrete methods - shared by all channels
  async callback(request: NextRequest): Promise<NextResponse> {
    try {
      // Extract parameters from URL
      const params = this.extractParams(request);
      console.log("Debug Param Edgar: " + JSON.stringify(params));
      // Check for OAuth errors
      if (params.error) {
        return this.createErrorRedirect(request, `OAuth error: ${params.error_description || params.error}`);
      }

      // Validate required parameters
      if (!params.code) {
        return this.createErrorRedirect(request, 'Missing authorization code');
      }

      // Get user ID from session
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return this.createErrorRedirect(request, 'User not authenticated. Please login first.');
      }

      const userId = session.user.id;

      // Channel-specific validation
      const validation = await this.validateSpecificParams(params);
      if (!validation.valid) {
        return this.createErrorRedirect(request, validation.error || 'Validation failed');
      }

      // Extract credentials
      const credentials = this.extractCredentials(params);
      
      // Validate credentials
      const credentialValidation = this.validateCredentials(credentials);
      if (!credentialValidation.valid) {
        return this.createErrorRedirect(request, `Missing required fields: ${credentialValidation.missing.join(', ')}`);
      }

      // Connect to database
      await this.connectToDatabase(credentials, userId);
      
      // Success redirect
      return this.createSuccessRedirect(request);

    } catch (error) {
      console.error(`Callback error for ${this.channelName}:`, error);
      return this.createErrorRedirect(request, 'Authentication failed');
    }
  }

  getConfig(): ChannelConfig {
    return this.config;
  }

  getName(): string {
    return this.channelName;
  }

  // Protected helper methods
  protected extractParams(request: NextRequest): Record<string, string> {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  protected validateCredentials(credentials: ChannelCredentials): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const field of this.config.requiredFields) {
      if (!credentials[field as keyof ChannelCredentials]) {
        missing.push(field);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  protected async connectToDatabase(credentials: ChannelCredentials, userId: string): Promise<void> {
    // Get channel from database
    const channelData = await ChannelService.getChannelTypeByName(this.channelName);
    if (!channelData) {
      throw new Error(`Channel ${this.channelName} not found in database`);
    }

    // Get team ID for the user
    let teamId: string;
    try {
      const userTeamId = await TeamUserService.getTeamIdByUserId(userId);
      teamId = userTeamId || DEFAULT_TEAM_ID; // Fallback to default team if user not in any team
      
      if (!userTeamId) {
        console.warn(`User ${userId} not found in any team, using default team ${DEFAULT_TEAM_ID}`);
      }
    } catch (error) {
      console.error(`Error getting team for user ${userId}:`, error);
      teamId = DEFAULT_TEAM_ID; // Fallback to default team
    }

    // Connect team to channel
    await ChannelsService.connectTeamToChannel(
      teamId,
      channelData.id,
      credentials
    );

    console.log(`Successfully connected ${this.channelName} for user ${userId} in team ${teamId}`);
  }

  protected createSuccessRedirect(request: NextRequest): NextResponse {
    const successUrl = new URL('/app/settings', request.url);
    successUrl.searchParams.set('success', `${this.channelName}_connected`);
    successUrl.searchParams.set('success_message', `${this.config.name} connected successfully!`);
    
    return NextResponse.redirect(successUrl);
  }

  protected createErrorRedirect(request: NextRequest, error: string): NextResponse {
    const errorUrl = new URL('/app/settings', request.url);
    errorUrl.searchParams.set('error', 'connection_failed');
    errorUrl.searchParams.set('error_message', error);
    
    return NextResponse.redirect(errorUrl);
  }

  // Protected helper methods for auth
  protected generateState(userId: string): string {
    const crypto = require('crypto');
    // Generate random state for OAuth security (no longer embedding user ID)
    return crypto.randomBytes(32).toString('hex');
  }

  protected getRedirectUri(customRedirectUri?: string): string {
    if (customRedirectUri) {
      return customRedirectUri;
    }
    return `https://1cube.netlify.app/api/callback/auth/${this.channelName.toLowerCase()}/`;
    
    // For Faster Debugging, use this instead of the above
    // return `http://localhost:3000/api/callback/auth/${this.channelName.toLowerCase()}/`;
    // return `${process.env.BASE_URL || 'http://localhost:3000'}/api/callback/auth/${this.channelName.toLowerCase()}`;
  }
}
