/**
 * Team-Channel Repository
 * Manages the relationship between teams and channels using Supabase
 * Works with the team_channel table structure:
 * - team_id (uuid), channel_id (uuid), shop_id (text), api_key (text)
 */

import { channelsLogger } from "../logger";
import { db } from "../database";

export interface TeamChannelConfig {
  team: string;           // team uuid
  channel_id: string;     // channel type id (e.g., "shopee")
  shop_id?: string;       // shop identifier
  api_key?: string;       // api key for the channel
  api_secret?: string;    // api secret
  connected: boolean;     // connection status
  last_sync?: Date;       // last sync date
  token?: string;         // access token
  refresh_token?: string; // refresh token
  code_verifier?: string; // PKCE code verifier for OAuth
  token_expires_at?: Date;        // when access token expires
  refresh_token_expires_at?: Date; // when refresh token expires
  token_created_at?: Date;        // when token was created/refreshed
  last_token_refresh?: Date;      // last successful token refresh
}

export class TeamChannelRepository {
  /**
   * Get all team-channel configurations for a team
   */
  async getTeamChannels(teamId: string): Promise<TeamChannelConfig[]> {
    try {
      const { data, error } = await db.getClient()
        .from('team_channels')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        channelsLogger.error('Error fetching team channels:', error);
        throw new Error(`Failed to fetch team channels: ${error.message}`);
      }

      return (data || []).map((tc: any) => ({
        team: tc.team_id,
        channel_id: tc.channel_id,
        shop_id: tc.shop_id || undefined,
        api_key: tc.api_key || undefined,
        api_secret: tc.api_secret || undefined,
        token: tc.token || undefined,
        refresh_token: tc.refresh_token || undefined,
        code_verifier: tc.code_verifier || undefined,
        connected: tc.connected || false,
        last_sync: tc.last_sync ? new Date(tc.last_sync) : undefined,
        token_expires_at: tc.token_expires_at ? new Date(tc.token_expires_at) : undefined,
        refresh_token_expires_at: tc.refresh_token_expires_at ? new Date(tc.refresh_token_expires_at) : undefined,
        token_created_at: tc.token_created_at ? new Date(tc.token_created_at) : undefined,
        last_token_refresh: tc.last_token_refresh ? new Date(tc.last_token_refresh) : undefined
      }));
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.getTeamChannels error:', error);
      throw error;
    }
  }

  /**
   * Get specific team-channel configuration
   */
  async getTeamChannel(teamId: string, channelId: string): Promise<TeamChannelConfig | null> {
    try {
      const { data, error } = await db.getClient()
        .from('team_channels')
        .select('*')
        .eq('team_id', teamId)
        .eq('channel_id', channelId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        channelsLogger.error('Error fetching team channel:', error);
        throw new Error(`Failed to fetch team channel: ${error.message}`);
      }

      if (!data) return null;

      return {
        team: data.team_id,
        channel_id: data.channel_id,
        shop_id: data.shop_id || undefined,
        api_key: data.api_key || undefined,
        api_secret: data.api_secret || undefined,
        token: data.token || undefined,
        refresh_token: data.refresh_token || undefined,
        code_verifier: data.code_verifier || undefined,
        connected: data.connected || false,
        last_sync: data.last_sync ? new Date(data.last_sync) : undefined,
        token_expires_at: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
        refresh_token_expires_at: data.refresh_token_expires_at ? new Date(data.refresh_token_expires_at) : undefined,
        token_created_at: data.token_created_at ? new Date(data.token_created_at) : undefined,
        last_token_refresh: data.last_token_refresh ? new Date(data.last_token_refresh) : undefined
      };
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.getTeamChannel error:', error);
      throw error;
    }
  }

  /**
   * Create or update team-channel configuration
   */
  async setTeamChannel(config: TeamChannelConfig): Promise<TeamChannelConfig> {
    try {
      // Check if team-channel relationship already exists
      const existing = await this.getTeamChannel(config.team, config.channel_id);

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await db.getClient()
          .from('team_channels')
          .update({
            shop_id: config.shop_id,
            api_key: config.api_key,
            api_secret: config.api_secret,
            token: config.token,
            refresh_token: config.refresh_token,
            code_verifier: config.code_verifier,
            token_expires_at: config.token_expires_at?.toISOString(),
            refresh_token_expires_at: config.refresh_token_expires_at?.toISOString(),
            token_created_at: config.token_created_at?.toISOString(),
            last_token_refresh: config.last_token_refresh?.toISOString(),
            connected: config.connected,
            last_sync: config.last_sync?.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('team_id', config.team)
          .eq('channel_id', config.channel_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update team channel: ${error.message}`);
        }
        result = data;
      } else {
        // Create new
        const { data, error } = await db.getClient()
          .from('team_channels')
          .insert({
            team_id: config.team,
            channel_id: config.channel_id,
            shop_id: config.shop_id,
            api_key: config.api_key,
            api_secret: config.api_secret,
            token: config.token,
            refresh_token: config.refresh_token,
            code_verifier: config.code_verifier,
            token_expires_at: config.token_expires_at?.toISOString(),
            refresh_token_expires_at: config.refresh_token_expires_at?.toISOString(),
            token_created_at: config.token_created_at?.toISOString(),
            last_token_refresh: config.last_token_refresh?.toISOString(),
            connected: config.connected,
            last_sync: config.last_sync?.toISOString()
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create team channel: ${error.message}`);
        }
        result = data;
      }

      return {
        team: result.team_id,
        channel_id: result.channel_id,
        shop_id: result.shop_id || undefined,
        api_key: result.api_key || undefined,
        api_secret: result.api_secret || undefined,
        token: result.token || undefined,
        refresh_token: result.refresh_token || undefined,
        code_verifier: result.code_verifier || undefined,
        token_expires_at: result.token_expires_at ? new Date(result.token_expires_at) : undefined,
        refresh_token_expires_at: result.refresh_token_expires_at ? new Date(result.refresh_token_expires_at) : undefined,
        token_created_at: result.token_created_at ? new Date(result.token_created_at) : undefined,
        last_token_refresh: result.last_token_refresh ? new Date(result.last_token_refresh) : undefined,
        connected: result.connected || false,
        last_sync: result.last_sync ? new Date(result.last_sync) : undefined
      };
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.setTeamChannel error:', error);
      throw error;
    }
  }

  /**
   * Remove team-channel configuration
   */
  async removeTeamChannel(teamId: string, channelId: string): Promise<boolean> {
    try {
      const { error } = await db.getClient()
        .from('team_channels')
        .delete()
        .eq('team_id', teamId)
        .eq('channel_id', channelId);

      if (error) {
        channelsLogger.error('Error removing team channel:', error);
        throw new Error(`Failed to remove team channel: ${error.message}`);
      }

      return true;
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.removeTeamChannel error:', error);
      return false;
    }
  }

  /**
   * Update team-channel credentials
   */
  async updateTeamChannelCredentials(
    teamId: string, 
    channelId: string, 
    credentials: { 
      shop_id?: string; 
      api_key?: string; 
      api_secret?: string; 
      token?: string; 
      refresh_token?: string;
      token_expires_at?: Date;
      refresh_token_expires_at?: Date;
      token_created_at?: Date;
      last_token_refresh?: Date;
    }
  ): Promise<TeamChannelConfig | null> {
    try {
      const { data, error } = await db.getClient()
        .from('team_channels')
        .update({
          shop_id: credentials.shop_id,
          api_key: credentials.api_key,
          api_secret: credentials.api_secret,
          token: credentials.token,
          refresh_token: credentials.refresh_token,
          token_expires_at: credentials.token_expires_at?.toISOString(),
          refresh_token_expires_at: credentials.refresh_token_expires_at?.toISOString(),
          token_created_at: credentials.token_created_at?.toISOString(),
          last_token_refresh: credentials.last_token_refresh?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('channel_id', channelId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        channelsLogger.error('Error updating team channel credentials:', error);
        throw new Error(`Failed to update team channel credentials: ${error.message}`);
      }

      if (!data) return null;

      return {
        team: data.team_id,
        channel_id: data.channel_id,
        shop_id: data.shop_id || undefined,
        api_key: data.api_key || undefined,
        api_secret: data.api_secret || undefined,
        token: data.token || undefined,
        refresh_token: data.refresh_token || undefined,
        connected: data.connected || false,
        last_sync: data.last_sync ? new Date(data.last_sync) : undefined,
        token_expires_at: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
        refresh_token_expires_at: data.refresh_token_expires_at ? new Date(data.refresh_token_expires_at) : undefined,
        token_created_at: data.token_created_at ? new Date(data.token_created_at) : undefined,
        last_token_refresh: data.last_token_refresh ? new Date(data.last_token_refresh) : undefined
      };
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.updateTeamChannelCredentials error:', error);
      throw error;
    }
  }

  /**
   * Update team-channel connection status
   */
  async updateTeamChannelStatus(
    teamId: string, 
    channelId: string, 
    connected: boolean, 
    lastSync?: Date
  ): Promise<TeamChannelConfig | null> {
    try {
      const { data, error } = await db.getClient()
        .from('team_channels')
        .update({
          connected,
          last_sync: (lastSync || (connected ? new Date() : undefined))?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('channel_id', channelId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        channelsLogger.error('Error updating team channel status:', error);
        throw new Error(`Failed to update team channel status: ${error.message}`);
      }

      if (!data) return null;

      return {
        team: data.team_id,
        channel_id: data.channel_id,
        shop_id: data.shop_id || undefined,
        api_key: data.api_key || undefined,
        api_secret: data.api_secret || undefined,
        token: data.token || undefined,
        refresh_token: data.refresh_token || undefined,
        connected: data.connected || false,
        last_sync: data.last_sync ? new Date(data.last_sync) : undefined
      };
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.updateTeamChannelStatus error:', error);
      throw error;
    }
  }

  /**
   * Check if team is connected to channel
   */
  async isTeamConnectedToChannel(teamId: string, channelId: string): Promise<boolean> {
    try {
      const config = await this.getTeamChannel(teamId, channelId);
      return config?.connected || false;
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.isTeamConnectedToChannel error:', error);
      return false;
    }
  }

  /**
   * Get teams connected to a specific channel
   */
  async getTeamsConnectedToChannel(channelId: string): Promise<TeamChannelConfig[]> {
    try {
      const { data, error } = await db.getClient()
        .from('team_channels')
        .select('*')
        .eq('channel_id', channelId)
        .eq('connected', true);

      if (error) {
        channelsLogger.error('Error fetching teams connected to channel:', error);
        throw new Error(`Failed to fetch teams connected to channel: ${error.message}`);
      }

      return (data || []).map((tc: any) => ({
        team: tc.team_id,
        channel_id: tc.channel_id,
        shop_id: tc.shop_id || undefined,
        api_key: tc.api_key || undefined,
        api_secret: tc.api_secret || undefined,
        token: tc.token || undefined,
        refresh_token: tc.refresh_token || undefined,
        connected: tc.connected || false,
        last_sync: tc.last_sync ? new Date(tc.last_sync) : undefined
      }));
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.getTeamsConnectedToChannel error:', error);
      throw error;
    }
  }

  /**
   * Bulk update last sync time for multiple teams/channels
   */
  async bulkUpdateLastSync(teamChannels: Array<{teamId: string, channelId: string}>, lastSync: Date): Promise<boolean> {
    try {
      for (const tc of teamChannels) {
        await this.updateTeamChannelStatus(tc.teamId, tc.channelId, true, lastSync);
      }
      return true;
    } catch (error) {
      channelsLogger.error('TeamChannelRepository.bulkUpdateLastSync error:', error);
      return false;
    }
  }
}

// Legacy compatibility export
export const TeamChannelService = new TeamChannelRepository();
