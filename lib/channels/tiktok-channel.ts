/**
 * TikTok Channel Implementation
 * Concrete implementation of BaseChannel for TikTok marketplace
 */

import { BaseChannel, type ChannelCredentials, type ChannelConfig, type AuthLinkParams, type AuthLinkResult } from "./interface/channel-base";
import { channelsLogger } from "@/lib/logger";
import { TikTokApiClient, type TikTokConfig } from "../api-clients/tiktok-api-client";
import { SessionRepository, TeamUserService, TeamChannelService, ChannelService } from "../repositories";
import { ChannelsService } from "../services";
import { ChannelFactory } from "./factory/channels";


export class TikTokChannel extends BaseChannel {
  private readonly HOST = process.env.NEXT_PUBLIC_TIKTOK_HOST!;
  private readonly APP_ID = process.env.NEXT_PUBLIC_TIKTOK_APP_ID!;
  private readonly APP_SECRET = process.env.NEXT_PUBLIC_TIKTOK_APP_SECRET!;
  private readonly CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!;
  private apiClient: TikTokApiClient;
  private sessionRepository: SessionRepository;

  constructor() {
    const config: ChannelConfig = {
      name: 'TikTok',
      description: 'Global platform for short-form video content and shopping',
      requiredFields: []
    };

    super('tiktok', config);

    const apiConfig: TikTokConfig = {
      host: this.HOST,
      appId: this.APP_ID,
      appSecret: this.APP_SECRET,
      clientKey: this.CLIENT_KEY
    };
    console.log('TikTokChannel constructor', apiConfig);
    this.apiClient = new TikTokApiClient(apiConfig);
    this.sessionRepository = new SessionRepository();
  }



  extractCredentials(params: Record<string, string>): ChannelCredentials {
    return {
      api_key: params.code
    };
  }

  async validateSpecificParams(params: Record<string, string>): Promise<{ valid: boolean; error?: string }> {
    if (params.error) {
      const errorMsg = params.error_description || params.error;
      return { valid: false, error: `TikTok OAuth error: ${errorMsg}` };
    }

    if (!params.code) {
      return { valid: false, error: 'Missing authorization code from TikTok OAuth' };
    }

    if (!params.state) {
      return { valid: false, error: 'Missing state parameter for OAuth security validation' };
    }

    const stateVerification = await this.sessionRepository.verifySessionState(params.state);
    if (!stateVerification.valid) {
      return { valid: false, error: stateVerification.error || 'Invalid OAuth state for TikTok' };
    }

    if (!params.scopes) {
      channelsLogger.warn('No scopes returned from TikTok OAuth - this may indicate limited permissions');
    }

    return { valid: true };
  }

  async generateAuthLink(params: AuthLinkParams): Promise<AuthLinkResult> {
    const state = this.generateState(params.userId);
    const redirectUri = this.getRedirectUri(params.redirectUri);

    channelsLogger.debug(`🔗 TikTok generateAuthLink - State: ${state}, UserId: ${params.userId}`);

    const { codeChallenge, codeVerifier } = this.apiClient.generatePKCEParams();

    // Store session state for OAuth security
    await this.sessionRepository.storeSessionState(state, params.userId, 'tiktok', codeVerifier);

    // Default scopes for TikTok API access
    const defaultScopes = [
      'user.info.basic',
      'video.publish',
      'video.upload',
      'video.list',
    ];

    const scopes = params.scopes && params.scopes.length > 0 ? params.scopes : defaultScopes;

    const authLink = this.apiClient.generateAuthUrl(redirectUri, state, scopes, codeChallenge);

    const verification = await this.sessionRepository.verifySessionState(state);
    if (!verification.valid) {
      throw new Error(`❌ Failed to store session state in database - OAuth link generation failed: ${verification.error}`);
    }

    channelsLogger.info('✅ TikTok auth link generated successfully with stored state');
    return { authLink, state };
  }

  async sync(): Promise<void> {
    // TODO: Implement TikTok-specific sync logic
    channelsLogger.debug(`Syncing ${this.getName()} data...`);
  }

  async getProducts(shopId: string, accessToken: string, options?: any): Promise<any[]> {
    // TODO: Implement TikTok-specific product fetching
    channelsLogger.debug(`Fetching products from ${this.getName()}...`);
    return [];
  }

  async getOrders(): Promise<any[]> {
    // TODO: Implement TikTok-specific order fetching
    channelsLogger.debug(`Fetching orders from ${this.getName()}...`);
    return [];
  }

  async getVideos(userId: string, options?: { maxCount?: number; cursor?: number }): Promise<any> {
    try {
      channelsLogger.debug(`Fetching videos from ${this.getName()} for user ${userId}...`);
      
      // Get user's access token for TikTok
      const accessToken = await this.getUserAccessToken(userId);
      if (!accessToken) {
        return {
          success: false,
          error: "No TikTok access token found. Please connect your TikTok account first.",
          videos: [],
          platform: 'TikTok'
        };
      }
      
      // Create request parameters for TikTok API
      const request = {
        max_count: options?.maxCount || 20,
        cursor: options?.cursor
      };

      // Call TikTok API to get video list
      const response = await this.apiClient.getVideoList(accessToken, request);
      
      channelsLogger.info(`✅ Successfully fetched ${response.data.videos.length} videos from TikTok for user ${userId}`);
      
      return {
        success: true,
        videos: response.data.videos,
        cursor: response.data.cursor,
        hasMore: response.data.has_more,
        totalCount: response.data.videos.length,
        platform: 'TikTok'
      };
      
    } catch (error) {
      channelsLogger.error(`❌ Failed to fetch videos from TikTok for user ${userId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching videos',
        videos: [],
        platform: 'TikTok'
      };
    }
  }

  async getAllVideos(userId: string): Promise<any> {
    try {
      channelsLogger.debug(`Fetching ALL videos from ${this.getName()} for user ${userId}...`);
      
      // Get user's access token for TikTok
      const accessToken = await this.getUserAccessToken(userId);
      if (!accessToken) {
        return {
          success: false,
          error: "No TikTok access token found. Please connect your TikTok account first.",
          videos: [],
          totalCount: 0,
          platform: 'TikTok'
        };
      }
      
      const allVideos: any[] = [];
      let cursor: number | undefined = undefined;
      let hasMore = true;
      let pageCount = 0;
      const maxPages = 100; // Safety limit to prevent infinite loops
      
      while (hasMore && pageCount < maxPages) {
        try {
          // Create request parameters for TikTok API
          const request = {
            max_count: 20, // Use maximum allowed per page
            cursor: cursor
          };

          // Call TikTok API to get video list
          const response = await this.apiClient.getVideoList(accessToken, request);
          
          // Add videos from this page to our collection
          if (response.data.videos && response.data.videos.length > 0) {
            allVideos.push(...response.data.videos);
            channelsLogger.debug(`📄 Page ${pageCount + 1}: Fetched ${response.data.videos.length} videos (Total so far: ${allVideos.length})`);
          }
          
          // Update pagination info
          cursor = response.data.cursor;
          hasMore = response.data.has_more;
          pageCount++;
          
          // Small delay between requests to be respectful to the API
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (pageError) {
          channelsLogger.error(`❌ Error fetching page ${pageCount + 1}:`, pageError);
          // Continue with partial results rather than failing completely
          break;
        }
      }
      
      if (pageCount >= maxPages) {
        channelsLogger.warn(`⚠️ Reached maximum page limit (${maxPages}) when fetching all videos for user ${userId}`);
      }
      
      channelsLogger.info(`✅ Successfully fetched ${allVideos.length} total videos from TikTok for user ${userId} (${pageCount} pages)`);
      
      return {
        success: true,
        videos: allVideos,
        totalCount: allVideos.length,
        pageCount: pageCount,
        platform: 'TikTok',
        note: pageCount >= maxPages ? 'Results may be incomplete due to page limit' : undefined
      };
      
    } catch (error) {
      channelsLogger.error(`❌ Failed to fetch all videos from TikTok for user ${userId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching all videos',
        videos: [],
        totalCount: 0,
        platform: 'TikTok'
      };
    }
  }

  async upload(files: File[], options: any): Promise<any> {
    try {
      channelsLogger.debug(`Starting TikTok upload for ${files.length} files`);
      
      // Get user's access token for TikTok
      const accessToken = await this.getUserAccessToken(options.userId);
      if (!accessToken) {
        return {
          success: false,
          error: "No TikTok access token found. Please connect your TikTok account first."
        };
      }

      const results = [];
      
      // Process each file based on its type
      for (const file of files) {
        try {
          const fileType = this.getFileType(file);
          let result;
          
          if (fileType === 'video') {
            result = await this.uploadVideo(file, options, accessToken);
          } else if (fileType === 'image') {
            result = await this.uploadImage(file, options, accessToken);
          } else {
            result = {
              success: false,
              filename: file.name || 'unknown',
              error: `Unsupported file type: ${file.type}. TikTok supports videos and images only.`
            };
          }
          
          results.push(result);
        } catch (fileError) {
          channelsLogger.error(`Error processing file ${file.name}:`, fileError);
          results.push({
            success: false,
            filename: file.name || 'unknown',
            error: fileError instanceof Error ? fileError.message : 'File processing failed'
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      channelsLogger.info(`TikTok upload complete: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: successCount > 0,
        results,
        metadata: {
          totalFiles: files.length,
          successCount,
          failureCount,
          platform: 'TikTok'
        }
      };
      
    } catch (error) {
      channelsLogger.error('TikTok upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown TikTok upload error'
      };
    }
  }

  private getFileType(file: File & { url?: string }): 'video' | 'image' | 'unsupported' {
    const mimeType = file.type;
    
    if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    // Fallback to filename extension
    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    
    if (extension && videoExtensions.includes(extension)) {
      return 'video';
    } else if (extension && imageExtensions.includes(extension)) {
      return 'image';
    }
    
    return 'unsupported';
  }

  private async uploadVideo(file: File & { url?: string }, options: any, accessToken: string): Promise<any> {
    try {
      channelsLogger.debug(`Uploading video: ${file.name}, size: ${file.size}`);
      
      // Create video publish request
      const videoRequest = this.apiClient.createVideoPublishRequest(
        options.title || file.name || 'Untitled Video',
        file.size,
        {
          privacyLevel: options.is_private ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE',
          disableDuet: options.disable_duet || false,
          disableComment: options.disable_comment || false, 
          disableStitch: options.disable_stitch || false,
          videoCoverTimestampMs: options.video_cover_timestamp || 0
        }
      );
      
      // Initialize video upload with TikTok
      const initResponse = await this.apiClient.initVideoPublish(accessToken, videoRequest);
      
      if (!initResponse.data?.publish_id) {
        throw new Error(`TikTok video init failed: ${initResponse.error?.message || 'Unknown error'}`);
      }
      
      channelsLogger.info(`✅ TikTok video upload initiated: ${file.name} -> publish_id: ${initResponse.data.publish_id}`);
      
      return {
        success: true,
        filename: file.name,
        publishId: initResponse.data.publish_id,
        uploadUrl: initResponse.data.upload_url,
        platform: 'TikTok',
        contentType: 'video',
        supabaseUrl: file.url || '',
        message: options.is_draft ? 'Video queued as draft' : 'Video upload initiated'
      };
      
    } catch (error) {
      channelsLogger.error(`TikTok video upload failed for ${file.name}:`, error);
      throw error;
    }
  }

  private async uploadImage(file: File & { url?: string }, options: any, accessToken: string): Promise<any> {
    try {
      channelsLogger.debug(`Uploading image: ${file.name}, size: ${file.size}`);
      
      // For images, we use the Supabase URL since TikTok supports PULL_FROM_URL
      if (!file.url) {
        throw new Error('Image URL is required for TikTok photo upload');
      }
      
      // Create photo publish request
      const photoRequest = this.apiClient.createPhotoPublishRequest(
        options.title || file.name || 'Untitled Photo',
        [file.url], // Use the Supabase URL
        {
          description: options.caption || '',
          privacyLevel: options.is_private ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE',
          disableComment: options.disable_comment || false,
          disableDuet: options.disable_duet || false,
          disableStitch: options.disable_stitch || false,
          autoAddMusic: true,
          postMode: options.is_draft ? 'SCHEDULED_POST' : 'DIRECT_POST'
        }
      );
      
      // Initialize photo upload with TikTok
      const initResponse = await this.apiClient.initPhotoPublish(accessToken, photoRequest);
      
      if (!initResponse.data?.publish_id) {
        throw new Error(`TikTok photo init failed: ${initResponse.error?.message || 'Unknown error'}`);
      }
      
      channelsLogger.info(`✅ TikTok photo upload initiated: ${file.name} -> publish_id: ${initResponse.data.publish_id}`);
      
      return {
        success: true,
        filename: file.name,
        publishId: initResponse.data.publish_id,
        platform: 'TikTok',
        contentType: 'image',
        supabaseUrl: file.url,
        message: options.is_draft ? 'Photo queued as draft' : 'Photo upload initiated'
      };
      
    } catch (error) {
      channelsLogger.error(`TikTok photo upload failed for ${file.name}:`, error);
      throw error;
    }
  }


  async getToken(tokenMap: Map<string, string>): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}> {
    try {
      const code = tokenMap.get('code');
      const state = tokenMap.get('state');
      const redirectUri = tokenMap.get('redirect_uri');
      const codeVerifier = tokenMap.get('code_verifier');

      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!state) {
        throw new Error('State parameter is required for security validation');
      }

      if (!redirectUri) {
        throw new Error('Redirect URI is required');
      }

      if (!codeVerifier) {
        throw new Error('Code verifier is required for PKCE flow');
      }

      // Exchange authorization code for access token using API client
      const tokenResponse = await this.apiClient.getAccessToken(code, codeVerifier, redirectUri);
      channelsLogger.info('🔑 TikTok getToken - Token response:', tokenResponse);

      return tokenResponse;
    } catch (error) {
      channelsLogger.error('❌ Failed to get TikTok access token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{access_token: string, refresh_token?: string, token_expired_at?: Date, refresh_token_expired_at?: Date}> {
    try {
      const tokenResponse = await this.apiClient.refreshAccessToken(refreshToken);
      channelsLogger.info('✅ Successfully refreshed TikTok access token');
      
      return tokenResponse;
    } catch (error) {
      channelsLogger.error('❌ Failed to refresh TikTok access token:', error);
      throw error;
    }
  }



}
