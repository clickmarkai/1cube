/**
 * Channel Repository
 * Manages channel master data from Supabase database
 * Replaces the hardcoded channel-types with actual database queries
 */

import { channelsLogger } from '../logger';
import { db } from '../database';

export interface ChannelType {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}

export class ChannelRepository {
  /**
   * Get all available channel types from database
   */
  async getAllChannelTypes(): Promise<ChannelType[]> {
    try {
      const { data, error } = await db.getClient()
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        channelsLogger.error('Error fetching channels:', error);
        throw new Error(`Failed to fetch channels: ${error.message}`);
      }

      return (data || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        created_at: new Date(channel.created_at)
      }));
    } catch (error) {
      channelsLogger.error('ChannelRepository.getAllChannelTypes error:', error);
      throw error;
    }
  }

  /**
   * Get channel type by ID from database
   */
  async getChannelTypeById(id: string): Promise<ChannelType | null> {
    try {
      const { data, error } = await db.getClient()
        .from('channels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        channelsLogger.error('Error fetching channel by ID:', error);
        throw new Error(`Failed to fetch channel: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      channelsLogger.error('ChannelRepository.getChannelTypeById error:', error);
      throw error;
    }
  }

  /**
   * Get channel type by name from database
   */
  async getChannelTypeByName(name: string): Promise<ChannelType | null> {
    try {
      const { data, error } = await db.getClient()
        .from('channels')
        .select('*')
        .ilike('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        channelsLogger.error('Error fetching channel by name:', error);
        throw new Error(`Failed to fetch channel: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      channelsLogger.error('ChannelRepository.getChannelTypeByName error:', error);
      throw error;
    }
  }

  /**
   * Check if channel type exists in database
   */
  async channelTypeExists(id: string): Promise<boolean> {
    try {
      const channel = await this.getChannelTypeById(id);
      return channel !== null;
    } catch (error) {
      channelsLogger.error('ChannelRepository.channelTypeExists error:', error);
      return false;
    }
  }

  /**
   * Create a new channel type
   */
  async createChannelType(channel: Omit<ChannelType, 'id' | 'created_at'>): Promise<ChannelType> {
    try {
      const { data, error } = await db.getClient()
        .from('channels')
        .insert({
          name: channel.name,
          description: channel.description
        })
        .select()
        .single();

      if (error) {
        channelsLogger.error('Error creating channel:', error);
        throw new Error(`Failed to create channel: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      channelsLogger.error('ChannelRepository.createChannelType error:', error);
      throw error;
    }
  }

  /**
   * Update an existing channel type
   */
  async updateChannelType(id: string, updates: Partial<Pick<ChannelType, 'name' | 'description'>>): Promise<ChannelType | null> {
    try {
      const { data, error } = await db.getClient()
        .from('channels')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        channelsLogger.error('Error updating channel:', error);
        throw new Error(`Failed to update channel: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      channelsLogger.error('ChannelRepository.updateChannelType error:', error);
      throw error;
    }
  }

  /**
   * Delete a channel type
   */
  async deleteChannelType(id: string): Promise<boolean> {
    try {
      const { error } = await db.getClient()
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) {
        channelsLogger.error('Error deleting channel:', error);
        throw new Error(`Failed to delete channel: ${error.message}`);
      }

      return true;
    } catch (error) {
      channelsLogger.error('ChannelRepository.deleteChannelType error:', error);
      return false;
    }
  }

  /**
   * Search channels by name pattern
   */
  async searchChannelsByName(pattern: string): Promise<ChannelType[]> {
    try {
      const { data, error } = await db.getClient()
        .from('channels')
        .select('*')
        .ilike('name', `%${pattern}%`)
        .order('name', { ascending: true });

      if (error) {
        channelsLogger.error('Error searching channels:', error);
        throw new Error(`Failed to search channels: ${error.message}`);
      }

      return (data || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        created_at: new Date(channel.created_at)
      }));
    } catch (error) {
      channelsLogger.error('ChannelRepository.searchChannelsByName error:', error);
      throw error;
    }
  }

  /**
   * Get channels with active connections
   */
  async getActiveChannels(): Promise<ChannelType[]> {
    try {
      // Get distinct channel IDs that have active team connections
      const { data: activeChannelIds, error: activeError } = await db.getClient()
        .from('team_channels')
        .select('channel_id')
        .eq('connected', true);

      if (activeError) {
        channelsLogger.error('Error fetching active channel IDs:', activeError);
        throw new Error(`Failed to fetch active channel IDs: ${activeError.message}`);
      }

      if (!activeChannelIds || activeChannelIds.length === 0) {
        return [];
      }

      // Get the channel details for active channels
      const channelIds = [...new Set(activeChannelIds.map(ac => ac.channel_id))];
      const { data, error } = await db.getClient()
        .from('channels')
        .select('*')
        .in('id', channelIds)
        .order('name', { ascending: true });

      if (error) {
        channelsLogger.error('Error fetching active channels:', error);
        throw new Error(`Failed to fetch active channels: ${error.message}`);
      }

      return (data || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        created_at: new Date(channel.created_at)
      }));
    } catch (error) {
      channelsLogger.error('ChannelRepository.getActiveChannels error:', error);
      throw error;
    }
  }

  /**
   * Get channel usage statistics
   */
  async getChannelUsageStats(): Promise<Array<{channel: ChannelType, teamCount: number, activeConnections: number}>> {
    try {
      const channels = await this.getAllChannelTypes();
      const stats = [];

      for (const channel of channels) {
        // Count total teams connected to this channel
        const { data: totalTeams, error: totalError } = await db.getClient()
          .from('team_channels')
          .select('team_id', { count: 'exact' })
          .eq('channel_id', channel.id);

        // Count active connections
        const { data: activeTeams, error: activeError } = await db.getClient()
          .from('team_channels')
          .select('team_id', { count: 'exact' })
          .eq('channel_id', channel.id)
          .eq('connected', true);

        if (totalError || activeError) {
          channelsLogger.error('Error fetching channel stats:', totalError || activeError);
          continue;
        }

        stats.push({
          channel,
          teamCount: totalTeams?.length || 0,
          activeConnections: activeTeams?.length || 0
        });
      }

      return stats;
    } catch (error) {
      channelsLogger.error('ChannelRepository.getChannelUsageStats error:', error);
      throw error;
    }
  }
}

// Legacy compatibility exports
export const ChannelService = new ChannelRepository();
export const ChannelTypesService = new ChannelRepository();
