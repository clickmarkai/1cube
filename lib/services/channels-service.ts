/**
 * Channels Service - New Architecture
 * Provides the interface you want while working with existing database schema
 */

import { ChannelService, ChannelType, TeamChannelService, TeamChannelConfig, TeamUserService } from "../repositories";
import { ChannelInfo } from "../channels/factory/channels";
import { channelsLogger } from "../logger";

export interface TeamInfo {
  id: string;
  name: string;
  // Additional team fields can be added as needed
}

export interface ChannelConnection {
  channel: ChannelType;
  config: TeamChannelConfig;
}

export const ChannelsService = {
  /**
   * Get all available channel types (your Channel table equivalent)
   */
  async getAvailableChannels(): Promise<ChannelType[]> {
    return ChannelService.getAllChannelTypes();
  },

  /**
   * Get a specific channel type by ID
   */
  async getChannelType(channelId: string): Promise<ChannelType | null> {
    return ChannelService.getChannelTypeById(channelId);
  },

  /**
   * Get all team-channel configurations for a team
   * (your TeamChannel table equivalent)
   */
  async getTeamChannelConfigs(teamId: string): Promise<TeamChannelConfig[]> {
    return TeamChannelService.getTeamChannels(teamId);
  },

  /**
   * Get team channels with full channel info
   */
  async getTeamChannelsWithInfo(teamId: string): Promise<ChannelConnection[]> {
    const configs = await TeamChannelService.getTeamChannels(teamId);
    
    const connections = [];
    for (const config of configs) {
      const channel = await ChannelService.getChannelTypeById(config.channel_id);
      if (!channel) {
        throw new Error(`Channel type ${config.channel_id} not found`);
      }
      
      connections.push({
        channel,
        config
      });
    }
    
    return connections;
  },

  /**
   * Connect a team to a channel (create TeamChannel relationship)
   */
  async connectTeamToChannel(
    teamId: string, 
    channelId: string, 
    credentials?: {
      shop_id?: string;
      api_key?: string;
      api_secret?: string;
      token?: string;
      refresh_token?: string;
      code_verifier?: string;
      token_expired_at?: Date;
      refresh_token_expired_at?: Date;
    }
  ): Promise<TeamChannelConfig> {
    const config: TeamChannelConfig = {
      team: teamId,
      channel_id: channelId,
      shop_id: credentials?.shop_id,
      api_key: credentials?.api_key,
      api_secret: credentials?.api_secret,
      token: credentials?.token,
      refresh_token: credentials?.refresh_token,
      code_verifier: credentials?.code_verifier,
      token_expires_at: credentials?.token_expired_at,
      refresh_token_expires_at: credentials?.refresh_token_expired_at,
      connected: true,
      last_sync: new Date()
    };

    return TeamChannelService.setTeamChannel(config);
  },

  /**
   * Disconnect a team from a channel
   */
  async disconnectTeamFromChannel(teamId: string, channelId: string): Promise<boolean> {
    return TeamChannelService.removeTeamChannel(teamId, channelId);
  },

  /**
   * Update team-channel credentials
   */
  async updateChannelCredentials(
    teamId: string,
    channelId: string,
    credentials: {
      shop_id?: string;
      api_key?: string;
      api_secret?: string;
      token?: string;
      refresh_token?: string;
      code_verifier?: string;
    }
  ): Promise<TeamChannelConfig | null> {
    return TeamChannelService.updateTeamChannelCredentials(teamId, channelId, credentials);
  },

  /**
   * Update channel connection status
   */
  async updateChannelStatus(
    teamId: string,
    channelId: string,
    connected: boolean
  ): Promise<TeamChannelConfig | null> {
    return TeamChannelService.updateTeamChannelStatus(teamId, channelId, connected);
  },

  /**
   * Check if team is connected to a specific channel
   */
  async isTeamConnectedToChannel(teamId: string, channelId: string): Promise<boolean> {
    const config = await TeamChannelService.getTeamChannel(teamId, channelId);
    return config?.connected || false;
  },

  /**
   * Get team channel configuration
   */
  async getTeamChannelConfig(teamId: string, channelId: string): Promise<TeamChannelConfig | null> {
    return TeamChannelService.getTeamChannel(teamId, channelId);
  }
};

// Legacy compatibility functions for settings page
const DEFAULT_TEAM_ID = "4aaa07c6-8291-441d-bcf6-1b6621bb27d1";

/**
 * Get channels for a user (compatibility function)
 * Converts from user-based API to team-based implementation
 */
export async function getChannelsByUserId(userId: string): Promise<{
  success: boolean;
  data?: ChannelInfo[];
  error?: string;
}> {
  try {
    // Get team ID for user
    let teamId: string;
    try {
      const userTeamId = await TeamUserService.getTeamIdByUserId(userId);
      teamId = userTeamId || DEFAULT_TEAM_ID;
    } catch (error) {
      channelsLogger.warn(`Could not get team for user ${userId}, using default team`);
      teamId = DEFAULT_TEAM_ID;
    }

    // Get all available channel types
    const availableChannels = await ChannelsService.getAvailableChannels();
    
    // Get team's channel configurations
    const teamChannels = await ChannelsService.getTeamChannelConfigs(teamId);
    
    // Create map for quick lookup
    const teamChannelMap = new Map<string, TeamChannelConfig>();
    teamChannels.forEach(tc => teamChannelMap.set(tc.channel_id, tc));

    // Combine available channels with team configurations
    const channels: ChannelInfo[] = availableChannels.map(channel => {
      const teamConfig = teamChannelMap.get(channel.id);
      
      // Default icon mapping
      const iconMap: Record<string, string> = {
        'shopee': '🛒',
        'tokopedia': '🏪',  
        'bukalapak': '🛍️',
        'tiktok': '🎵'
      };

      return {
        id: channel.id,
        name: channel.name,
        icon: iconMap[channel.name.toLowerCase()] || '🏬',
        connected: teamConfig?.connected || false,
        lastSync: teamConfig?.last_sync
      };
    });

    return {
      success: true,
      data: channels
    };
  } catch (error) {
    channelsLogger.error('getChannelsByUserId error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update channel connection by name (compatibility function)
 * Converts from user-based API to team-based implementation
 */
export async function updateChannelConnectionByName(
  userId: string,
  channelName: string,
  connected: boolean,
  lastSync?: Date
): Promise<{
  success: boolean;
  data?: TeamChannelConfig;
  error?: string;
}> {
  try {
    // Get team ID for user
    let teamId: string;
    try {
      const userTeamId = await TeamUserService.getTeamIdByUserId(userId);
      teamId = userTeamId || DEFAULT_TEAM_ID;
    } catch (error) {
      channelsLogger.warn(`Could not get team for user ${userId}, using default team`);
      teamId = DEFAULT_TEAM_ID;
    }

    // Get channel by name
    const channel = await ChannelService.getChannelTypeByName(channelName);
    if (!channel) {
      return {
        success: false,
        error: `Channel '${channelName}' not found`
      };
    }

    let result: TeamChannelConfig | null;

    if (connected) {
      // Connect team to channel
      result = await ChannelsService.connectTeamToChannel(teamId, channel.id);
    } else {
      // Update status to disconnected
      result = await ChannelsService.updateChannelStatus(teamId, channel.id, false);
    }

    if (!result) {
      return {
        success: false,
        error: 'Failed to update channel connection'
      };
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    channelsLogger.error('updateChannelConnectionByName error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export types for use in other parts of the application
export type { ChannelType, TeamChannelConfig };
