/**
 * Channel Service
 * Manages channel master data from Supabase database
 * Replaces the hardcoded channel-types with actual database queries
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ChannelType {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}

export const ChannelService = {
  /**
   * Get all available channel types from database
   */
  async getAllChannelTypes(): Promise<ChannelType[]> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching channels:', error);
        throw new Error(`Failed to fetch channels: ${error.message}`);
      }

      return (data || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        created_at: new Date(channel.created_at)
      }));
    } catch (error) {
      console.error('ChannelService.getAllChannelTypes error:', error);
      throw error;
    }
  },

  /**
   * Get channel type by ID from database
   */
  async getChannelTypeById(id: string): Promise<ChannelType | null> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching channel by ID:', error);
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
      console.error('ChannelService.getChannelTypeById error:', error);
      throw error;
    }
  },

  /**
   * Get channel type by name from database
   */
  async getChannelTypeByName(name: string): Promise<ChannelType | null> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .ilike('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching channel by name:', error);
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
      console.error('ChannelService.getChannelTypeByName error:', error);
      throw error;
    }
  },

  /**
   * Check if channel type exists in database
   */
  async channelTypeExists(id: string): Promise<boolean> {
    try {
      const channel = await this.getChannelTypeById(id);
      return channel !== null;
    } catch (error) {
      console.error('ChannelService.channelTypeExists error:', error);
      return false;
    }
  },

  /**
   * Create a new channel type
   */
  async createChannelType(channel: Omit<ChannelType, 'id' | 'created_at'>): Promise<ChannelType> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: channel.name,
          description: channel.description
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating channel:', error);
        throw new Error(`Failed to create channel: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        created_at: new Date(data.created_at)
      };
    } catch (error) {
      console.error('ChannelService.createChannelType error:', error);
      throw error;
    }
  },

  /**
   * Update an existing channel type
   */
  async updateChannelType(id: string, updates: Partial<Pick<ChannelType, 'name' | 'description'>>): Promise<ChannelType | null> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating channel:', error);
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
      console.error('ChannelService.updateChannelType error:', error);
      throw error;
    }
  },

  /**
   * Delete a channel type
   */
  async deleteChannelType(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting channel:', error);
        throw new Error(`Failed to delete channel: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('ChannelService.deleteChannelType error:', error);
      return false;
    }
  }
};

// Legacy exports for backwards compatibility
export const ChannelTypesService = ChannelService;
