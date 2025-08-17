import { channelsDB } from './channels-db';
import { type Channel, type UserChannel } from './channels';

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export const channelsService = {
  async getChannelsByUserId(userId: string): Promise<ServiceResponse<Channel[]>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const channels = channelsDB.getByUserId(userId);
      return {
        success: true,
        data: channels,
        total: channels.length
      };
    } catch (error) {
      console.error('Error fetching channels:', error);
      return {
        success: false,
        error: 'Failed to fetch channels'
      };
    }
  },

  async getAllChannels(): Promise<ServiceResponse<UserChannel[]>> {
    try {
      const channels = channelsDB.getAll();
      return {
        success: true,
        data: channels,
        total: channels.length
      };
    } catch (error) {
      console.error('Error fetching channels:', error);
      return {
        success: false,
        error: 'Failed to fetch channels'
      };
    }
  },

  async getChannelById(id: number): Promise<ServiceResponse<Channel>> {
    try {
      const channel = channelsDB.getById(id);
      
      if (!channel) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      return {
        success: true,
        data: channel
      };
    } catch (error) {
      console.error('Error fetching channel:', error);
      return {
        success: false,
        error: 'Failed to fetch channel'
      };
    }
  },

  async updateChannelConnectionByName(
    userId: string,
    channelName: string, 
    connected: boolean, 
    lastSync?: Date
  ): Promise<ServiceResponse<Channel>> {
    try {
      if (typeof connected !== 'boolean') {
        return {
          success: false,
          error: 'connected field must be a boolean'
        };
      }

      const updatedChannel = channelsDB.updateConnectionByName(userId, channelName, connected, lastSync);

      if (!updatedChannel) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      return {
        success: true,
        data: updatedChannel
      };
    } catch (error) {
      console.error('Error updating channel connection:', error);
      return {
        success: false,
        error: 'Failed to update channel connection'
      };
    }
  },

  async updateChannelCredentialsByName(
    userId: string,
    channelName: string, 
    credentials: Channel['credentials']
  ): Promise<ServiceResponse<Channel>> {
    try {
      const updatedChannel = channelsDB.updateCredentialsByName(userId, channelName, credentials);

      if (!updatedChannel) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      return {
        success: true,
        data: updatedChannel
      };
    } catch (error) {
      console.error('Error updating channel credentials:', error);
      return {
        success: false,
        error: 'Failed to update channel credentials'
      };
    }
  },

  async addChannelByName(
    userId: string,
    channelName: string,
    credentials?: any,
    lastSync?: Date
  ): Promise<ServiceResponse<Channel>> {
    try {
      if (!channelName) {
        return {
          success: false,
          error: 'channel name is required'
        };
      }

      const result = channelsDB.addByName(userId, channelName, credentials, lastSync);

      if (result.success && result.channel) {
        return {
          success: true,
          data: result.channel
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to add channel'
        };
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      return {
        success: false,
        error: 'Failed to create channel'
      };
    }
  },

  async removeChannelByName(userId: string, channelName: string): Promise<ServiceResponse<null>> {
    try {
      const success = channelsDB.removeByName(userId, channelName);
      
      if (!success) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error('Error removing channel:', error);
      return {
        success: false,
        error: 'Failed to remove channel'
      };
    }
  }
};

export const {
  getChannelsByUserId,
  getAllChannels,
  getChannelById,
  updateChannelConnectionByName,
  updateChannelCredentialsByName,
  addChannelByName,
  removeChannelByName
} = channelsService;

// Backward compatibility aliases
export const updateChannelConnection = channelsService.updateChannelConnectionByName;
export const updateChannelCredentials = channelsService.updateChannelCredentialsByName;
export const addChannel = channelsService.addChannelByName;
export const removeChannel = channelsService.removeChannelByName;
