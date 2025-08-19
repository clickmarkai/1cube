/**
 * Channels Service - New Architecture
 * Provides the interface you want while working with existing database schema
 */

import { ChannelService, ChannelType } from "./channel";
import { TeamChannelService, TeamChannelConfig } from "./team-channel";

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
    }
  ): Promise<TeamChannelConfig> {
    const config: TeamChannelConfig = {
      team: teamId,
      channel_id: channelId,
      shop_id: credentials?.shop_id,
      api_key: credentials?.api_key,
      api_secret: credentials?.api_secret,
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

// Export types for use in other parts of the application
export type { ChannelType, TeamChannelConfig };