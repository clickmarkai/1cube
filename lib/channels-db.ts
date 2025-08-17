import { Channel, UserChannel, ChannelRegistry } from './channels';

// In-memory storage for user channel connections
let userChannelsDatabase: UserChannel[] = [];
let nextUserChannelId = 1;

export const channelsDB = {
  // Get all available channels for a user (combines channel registry with user connections)
  getByUserId(userId: string): Channel[] {
    const availableChannels = ChannelRegistry.getAllChannels();
    
    return availableChannels.map(channelDef => {
      const userChannel = userChannelsDatabase.find(
        uc => uc.userId === userId && uc.channelId === channelDef.id
      );

      if (userChannel) {
        return {
          id: userChannel.id,
          channelId: channelDef.id,
          name: channelDef.name,
          icon: channelDef.icon,
          connected: true,
          userId: userId,
          lastSync: userChannel.lastSync,
          credentials: userChannel.credentials,
          description: channelDef.description,
          authType: channelDef.authType,
          requiredCredentials: channelDef.requiredCredentials,
          optionalCredentials: channelDef.optionalCredentials
        } as Channel;
      } else {
        return {
          id: -channelDef.id, // Virtual ID for unconnected channels (negative to avoid conflicts)
          channelId: channelDef.id,
          name: channelDef.name,
          icon: channelDef.icon,
          connected: false,
          userId: userId,
          description: channelDef.description,
          authType: channelDef.authType,
          requiredCredentials: channelDef.requiredCredentials,
          optionalCredentials: channelDef.optionalCredentials
        } as Channel;
      }
    });
  },

  // Get all user channels (admin function)
  getAll(): UserChannel[] {
    return [...userChannelsDatabase];
  },

  // Get user channel by ID
  getById(id: number): Channel | undefined {
    if (id <= 0) return undefined; // Virtual ID for unconnected channels

    const userChannel = userChannelsDatabase.find(uc => uc.id === id);
    if (!userChannel) return undefined;

    const channelDef = ChannelRegistry.getChannelDefinition(userChannel.channelId);
    if (!channelDef) return undefined;

    return {
      id: userChannel.id,
      channelId: channelDef.id,
      name: channelDef.name,
      icon: channelDef.icon,
      connected: true,
      userId: userChannel.userId,
      lastSync: userChannel.lastSync,
      credentials: userChannel.credentials,
      description: channelDef.description,
      authType: channelDef.authType,
      requiredCredentials: channelDef.requiredCredentials,
      optionalCredentials: channelDef.optionalCredentials
    } as Channel;
  },

  // Get user channel by user ID and channel name
  getConnectedChannelByName(userId: string, channelName: string): Channel | undefined {
    const channelDef = ChannelRegistry.getChannelDefinitionByName(channelName);
    if (!channelDef) return undefined;

    const userChannel = userChannelsDatabase.find(
      uc => uc.userId === userId && uc.channelId === channelDef.id
    );

    if (!userChannel) return undefined;

    return {
      id: userChannel.id,
      channelId: channelDef.id,
      name: channelDef.name,
      icon: channelDef.icon,
      connected: true,
      userId: userChannel.userId,
      lastSync: userChannel.lastSync,
      credentials: userChannel.credentials,
      description: channelDef.description,
      authType: channelDef.authType,
      requiredCredentials: channelDef.requiredCredentials,
      optionalCredentials: channelDef.optionalCredentials
    } as Channel;
  },

  // Update or disconnect channel connection by channel name
  updateConnectionByName(userId: string, channelName: string, connected: boolean, lastSync?: Date): Channel | null {
    const channelDef = ChannelRegistry.getChannelDefinitionByName(channelName);
    if (!channelDef) return null;

    const userChannelIndex = userChannelsDatabase.findIndex(
      uc => uc.userId === userId && uc.channelId === channelDef.id
    );

    if (userChannelIndex === -1) {
      if (connected) {
        return null; // Can't connect what doesn't exist
      } else {
        // Already disconnected, return virtual disconnected channel
        return {
          id: -channelDef.id,
          channelId: channelDef.id,
          name: channelDef.name,
          icon: channelDef.icon,
          connected: false,
          userId: userId,
          description: channelDef.description,
          authType: channelDef.authType,
          requiredCredentials: channelDef.requiredCredentials,
          optionalCredentials: channelDef.optionalCredentials
        } as Channel;
      }
    }

    if (connected) {
      userChannelsDatabase[userChannelIndex] = {
        ...userChannelsDatabase[userChannelIndex],
        lastSync: lastSync || new Date()
      };

      return {
        id: userChannelsDatabase[userChannelIndex].id,
        channelId: channelDef.id,
        name: channelDef.name,
        icon: channelDef.icon,
        connected: true,
        userId: userId,
        lastSync: userChannelsDatabase[userChannelIndex].lastSync,
        credentials: userChannelsDatabase[userChannelIndex].credentials,
        description: channelDef.description,
        authType: channelDef.authType,
        requiredCredentials: channelDef.requiredCredentials,
        optionalCredentials: channelDef.optionalCredentials
      } as Channel;
    } else {
      // Disconnect - remove from database
      const [removedUserChannel] = userChannelsDatabase.splice(userChannelIndex, 1);
      
      return {
        id: -channelDef.id, // Virtual ID for disconnected
        channelId: channelDef.id,
        name: channelDef.name,
        icon: channelDef.icon,
        connected: false,
        userId: userId,
        lastSync: undefined,
        credentials: undefined,
        description: channelDef.description,
        authType: channelDef.authType,
        requiredCredentials: channelDef.requiredCredentials,
        optionalCredentials: channelDef.optionalCredentials
      } as Channel;
    }
  },

  // Update channel credentials by channel name
  updateCredentialsByName(userId: string, channelName: string, credentials: any): Channel | null {
    const channelDef = ChannelRegistry.getChannelDefinitionByName(channelName);
    if (!channelDef) return null;

    const userChannelIndex = userChannelsDatabase.findIndex(
      uc => uc.userId === userId && uc.channelId === channelDef.id
    );

    if (userChannelIndex === -1) return null;

    userChannelsDatabase[userChannelIndex] = {
      ...userChannelsDatabase[userChannelIndex],
      credentials
    };

    return {
      id: userChannelsDatabase[userChannelIndex].id,
      channelId: channelDef.id,
      name: channelDef.name,
      icon: channelDef.icon,
      connected: true,
      userId: userId,
      lastSync: userChannelsDatabase[userChannelIndex].lastSync,
      credentials: userChannelsDatabase[userChannelIndex].credentials,
      description: channelDef.description,
      authType: channelDef.authType,
      requiredCredentials: channelDef.requiredCredentials,
      optionalCredentials: channelDef.optionalCredentials
    } as Channel;
  },

  // Add new channel connection by channel name
  addByName(userId: string, channelName: string, credentials?: any, lastSync?: Date): { success: boolean; channel?: Channel; error?: string } {
    try {
      const channelDef = ChannelRegistry.getChannelDefinitionByName(channelName);
      if (!channelDef) {
        return { success: false, error: `Channel '${channelName}' not found in registry` };
      }

      const existingUserChannelIndex = userChannelsDatabase.findIndex(
        uc => uc.userId === userId && uc.channelId === channelDef.id
      );

      if (existingUserChannelIndex !== -1) {
        // Update existing connection
        userChannelsDatabase[existingUserChannelIndex] = {
          ...userChannelsDatabase[existingUserChannelIndex],
          lastSync: lastSync || new Date(),
          credentials: credentials || userChannelsDatabase[existingUserChannelIndex].credentials
        };

        const channel: Channel = {
          id: userChannelsDatabase[existingUserChannelIndex].id,
          channelId: channelDef.id,
          name: channelDef.name,
          icon: channelDef.icon,
          connected: true,
          userId: userId,
          lastSync: userChannelsDatabase[existingUserChannelIndex].lastSync,
          credentials: userChannelsDatabase[existingUserChannelIndex].credentials,
          description: channelDef.description,
          authType: channelDef.authType,
          requiredCredentials: channelDef.requiredCredentials,
          optionalCredentials: channelDef.optionalCredentials
        };

        return { success: true, channel };
      } else {
        // Create new connection
        const newUserChannel: UserChannel = {
          id: nextUserChannelId++,
          channelId: channelDef.id,
          userId: userId,
          lastSync: lastSync || new Date(),
          credentials: credentials
        };

        userChannelsDatabase.push(newUserChannel);

        const channel: Channel = {
          id: newUserChannel.id,
          channelId: channelDef.id,
          name: channelDef.name,
          icon: channelDef.icon,
          connected: true,
          userId: userId,
          lastSync: newUserChannel.lastSync,
          credentials: newUserChannel.credentials,
          description: channelDef.description,
          authType: channelDef.authType,
          requiredCredentials: channelDef.requiredCredentials,
          optionalCredentials: channelDef.optionalCredentials
        };

        return { success: true, channel };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Remove channel connection by channel name
  removeByName(userId: string, channelName: string): boolean {
    const channelDef = ChannelRegistry.getChannelDefinitionByName(channelName);
    if (!channelDef) return false;

    const initialLength = userChannelsDatabase.length;
    userChannelsDatabase = userChannelsDatabase.filter(
      uc => !(uc.userId === userId && uc.channelId === channelDef.id)
    );

    return userChannelsDatabase.length < initialLength;
  }
};