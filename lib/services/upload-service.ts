/**
 * Upload Service
 * Handles file uploads for channels
 */

import { channelsLogger } from "../logger";
import { db } from "../database/database-connection";
import { ChannelFactory } from "../channels/factory/channels";
import { ChannelService, TeamUserService, TeamChannelService } from "../repositories";

export interface UploadOptions {
  // Content settings (required when coming from API)
  is_draft?: boolean;
  title?: string;
  caption?: string;
  channel?: string;
  
  // TikTok specific settings (optional)
  disable_duet?: boolean;
  disable_stitch?: boolean;
  disable_comment?: boolean;
  video_cover_timestamp?: number;
  brand_content?: boolean;
  brand_organic?: boolean;
  is_private?: boolean;
  
  // Additional context
  channelId?: string;
  teamId?: string;
  userId?: string;
}

export interface UploadResult {
  success: boolean;
  files?: {
    fileId: string;
    filename: string;
    fileUrl: string;
    size: number;
    contentType: string;
    error?: string;
  }[];
  channelResult?: any; // Result from channel-specific processing
  error?: string;
  metadata?: Record<string, any>;
}


export const UploadService = {
  /**
   * Upload files for a specific channel
   */
  async upload(
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      channelsLogger.debug(`Starting upload for ${files.length} files to channel: ${options.channel}`);
      
      const supabase = db.getClient();
      const uploadedFiles = [];
      const bucket = 'content'; // Supabase storage bucket name
      
      // Upload each file to Supabase storage
      for (const file of files) {
        try {
          // Generate unique filename to avoid conflicts
          const timestamp = new Date().getTime();
          const randomId = Math.random().toString(36).substring(2);
          const fileExtension = file.name.split('.').pop() || '';
          const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`;
          
          // Create file path with channel context
          const filePath = `${options.channel || 'uploads'}/${uniqueFileName}`;
          
          channelsLogger.debug(`Uploading file: ${file.name} as ${filePath}`);
          
          // Convert File to ArrayBuffer for upload
          const fileBuffer = await file.arrayBuffer();
          
          // Upload file to Supabase storage
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            channelsLogger.error(`Failed to upload ${file.name}:`, error);
            throw error;
          }

          // Get public URL for the uploaded file
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            uploadedFiles.push({
              fileId: data.path,
              filename: file.name,
              fileUrl: urlData.publicUrl,
              size: file.size,
              contentType: file.type
            });

            channelsLogger.info(`✅ Successfully uploaded: ${file.name} -> ${urlData.publicUrl}`);
          } else {
            throw new Error(`Failed to get public URL for ${file.name}`);
          }
        } catch (fileError) {
          channelsLogger.error(`Error uploading individual file ${file.name}:`, fileError);
          // Continue with other files rather than failing completely
          uploadedFiles.push({
            fileId: '',
            filename: file.name,
            fileUrl: '',
            size: file.size,
            contentType: file.type,
            error: fileError instanceof Error ? fileError.message : 'Upload failed'
          });
        }
      }
      
      const successfulUploads = uploadedFiles.filter(f => f.fileUrl && !f.error);
      const failedUploads = uploadedFiles.filter(f => f.error);
      
      channelsLogger.info(`Supabase upload complete: ${successfulUploads.length} successful, ${failedUploads.length} failed`);
      
      // Call channel-specific upload logic if we have successful uploads and a channel specified
      let channelResult = null;
      if (successfulUploads.length > 0 && options.channel) {
        try {
          channelsLogger.debug(`Calling ${options.channel} channel upload with ${successfulUploads.length} files`);
          
          const channel = ChannelFactory.getChannel(options.channel);
          if (channel) {
            // Get team and channel information for the user
            let teamChannelInfo = null;
            if (options.userId) {
              try {
                // Get user's team ID
                const teamId = await TeamUserService.getTeamIdByUserId(options.userId);
                if (teamId) {
                  // Get channel type ID
                  const channelType = await ChannelService.getChannelTypeByName(options.channel.toLowerCase());
                  if (channelType) {
                    // Get team channel configuration
                    const teamChannelConfig = await TeamChannelService.getTeamChannel(teamId, channelType.id);
                    if (teamChannelConfig) {
                      teamChannelInfo = {
                        teamId,
                        channelTypeId: channelType.id,
                        teamChannelConfig
                      };
                      channelsLogger.debug(`📋 Retrieved team/channel info for ${options.channel}: teamId=${teamId}, channelId=${channelType.id}`);
                    }
                  }
                }
              } catch (teamChannelError) {
                channelsLogger.warn(`⚠️ Could not get team/channel info for user ${options.userId}:`, teamChannelError);
              }
            }

            // Create File-like objects from the uploaded data for channel processing
            const processedFiles = successfulUploads.map(upload => {
              // Create a file-like object with the uploaded data
              return {
                name: upload.filename,
                size: upload.size,
                type: upload.contentType,
                url: upload.fileUrl, // Add URL for channel processing
                fileId: upload.fileId,
                // Add other File properties as needed
                lastModified: Date.now(),
                webkitRelativePath: ''
              } as File & { url: string; fileId: string };
            });
            
            // Call channel upload with the uploaded file metadata and options
            channelResult = await channel.upload(processedFiles, {
              ...options,
              supabaseFiles: successfulUploads, // Pass Supabase upload results
              publicUrls: successfulUploads.map(f => f.fileUrl),
              teamChannelInfo // Pass team/channel information
            });
            
            channelsLogger.info(`✅ ${options.channel} channel processing completed`);
          } else {
            channelsLogger.warn(`Channel '${options.channel}' not found in ChannelFactory`);
          }
        } catch (channelError) {
          channelsLogger.error(`Channel ${options.channel} upload error:`, channelError);
          // Don't fail the entire upload if channel processing fails
          channelResult = {
            success: false,
            error: channelError instanceof Error ? channelError.message : 'Channel processing failed'
          };
        }
      }
      
      return {
        success: successfulUploads.length > 0,
        files: uploadedFiles,
        channelResult, // Include channel-specific response
        metadata: {
          fileCount: files.length,
          successCount: successfulUploads.length,
          failedCount: failedUploads.length,
          totalSize: files.reduce((total, file) => total + file.size, 0),
          options,
          bucket,
          publicUrls: successfulUploads.map(f => f.fileUrl),
          channelProcessed: !!channelResult
        }
      };
    } catch (error) {
      channelsLogger.error('Upload service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }
};

