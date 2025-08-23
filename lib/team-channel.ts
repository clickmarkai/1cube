/**
 * Team-Channel Service
 * Manages the relationship between teams and channels using Supabase
 * Works with the team_channel table structure:
 * - team_id (uuid), channel_id (uuid), shop_id (text), api_key (text)
 */

import { createClient } from '@supabase/supabase-js';
import { ChannelService } from "./channel";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface TeamChannelConfig {
  team: string;           // team uuid
  channel_id: string;     // channel type id (e.g., "shopee")
  shop_id?: string;       // shop identifier
  api_key?: string;       // api key for the channel
  api_secret?: string;    // api secret
  connected: boolean;     // connection status
  last_sync?: Date;       // last sync date
}

export const TeamChannelService = {
  /**
   * Get all team-channel configurations for a team
   */
  async getTeamChannels(teamId: string): Promise<TeamChannelConfig[]> {
    try {
      const { data, error } = await supabase
        .from('team_channels')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team channels:', error);
        throw new Error(`Failed to fetch team channels: ${error.message}`);
      }

      return (data || []).map((tc: any) => ({
        team: tc.team_id,
        channel_id: tc.channel_id,
        shop_id: tc.shop_id || undefined,
        api_key: tc.api_key || undefined,
        api_secret: tc.api_secret || undefined,
        connected: tc.connected || false,
        last_sync: tc.last_sync ? new Date(tc.last_sync) : undefined
      }));
    } catch (error) {
      console.error('TeamChannelService.getTeamChannels error:', error);
      throw error;
    }
  },

  /**
   * Get specific team-channel configuration
   */
  async getTeamChannel(teamId: string, channelId: string): Promise<TeamChannelConfig | null> {
    try {
      const { data, error } = await supabase
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
        console.error('Error fetching team channel:', error);
        throw new Error(`Failed to fetch team channel: ${error.message}`);
      }

      if (!data) return null;

      return {
        team: data.team_id,
        channel_id: data.channel_id,
        shop_id: data.shop_id || undefined,
        api_key: data.api_key || undefined,
        api_secret: data.api_secret || undefined,
        connected: data.connected || false,
        last_sync: data.last_sync ? new Date(data.last_sync) : undefined
      };
    } catch (error) {
      console.error('TeamChannelService.getTeamChannel error:', error);
      throw error;
    }
  },

  /**
   * Create or update team-channel configuration
   */
  async setTeamChannel(config: TeamChannelConfig): Promise<TeamChannelConfig> {
    try {
      // Verify channel type exists
      const channelExists = await ChannelService.channelTypeExists(config.channel_id);
      if (!channelExists) {
        throw new Error(`Channel type '${config.channel_id}' does not exist`);
      }

      // Check if team-channel relationship already exists
      const existing = await this.getTeamChannel(config.team, config.channel_id);

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('team_channels')
          .update({
            shop_id: config.shop_id,
            api_key: config.api_key,
            api_secret: config.api_secret,
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
        const { data, error } = await supabase
          .from('team_channels')
          .insert({
            team_id: config.team,
            channel_id: config.channel_id,
            shop_id: config.shop_id,
            api_key: config.api_key,
            api_secret: config.api_secret,
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
        connected: result.connected || false,
        last_sync: result.last_sync ? new Date(result.last_sync) : undefined
      };
    } catch (error) {
      console.error('TeamChannelService.setTeamChannel error:', error);
      throw error;
    }
  },

  /**
   * Remove team-channel configuration
   */
  async removeTeamChannel(teamId: string, channelId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_channels')
        .delete()
        .eq('team_id', teamId)
        .eq('channel_id', channelId);

      if (error) {
        console.error('Error removing team channel:', error);
        throw new Error(`Failed to remove team channel: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('TeamChannelService.removeTeamChannel error:', error);
      return false;
    }
  },

  /**
   * Update team-channel credentials
   */
  async updateTeamChannelCredentials(
    teamId: string, 
    channelId: string, 
    credentials: { shop_id?: string; api_key?: string; api_secret?: string }
  ): Promise<TeamChannelConfig | null> {
    try {
      const { data, error } = await supabase
        .from('team_channels')
        .update({
          shop_id: credentials.shop_id,
          api_key: credentials.api_key,
          api_secret: credentials.api_secret,
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
        console.error('Error updating team channel credentials:', error);
        throw new Error(`Failed to update team channel credentials: ${error.message}`);
      }

      if (!data) return null;

      return {
        team: data.team_id,
        channel_id: data.channel_id,
        shop_id: data.shop_id || undefined,
        api_key: data.api_key || undefined,
        api_secret: data.api_secret || undefined,
        connected: data.connected || false,
        last_sync: data.last_sync ? new Date(data.last_sync) : undefined
      };
    } catch (error) {
      console.error('TeamChannelService.updateTeamChannelCredentials error:', error);
      throw error;
    }
  },

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
      const { data, error } = await supabase
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
        console.error('Error updating team channel status:', error);
        throw new Error(`Failed to update team channel status: ${error.message}`);
      }

      if (!data) return null;

      return {
        team: data.team_id,
        channel_id: data.channel_id,
        shop_id: data.shop_id || undefined,
        api_key: data.api_key || undefined,
        api_secret: data.api_secret || undefined,
        connected: data.connected || false,
        last_sync: data.last_sync ? new Date(data.last_sync) : undefined
      };
    } catch (error) {
      console.error('TeamChannelService.updateTeamChannelStatus error:', error);
      throw error;
    }
  }
};
