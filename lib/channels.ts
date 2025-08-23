/**
 * Object-Oriented Channel Factory System
 * Factory pattern with abstract base class and concrete implementations
 */

import { BaseChannel, type AuthLinkParams, type AuthLinkResult } from "./channel-base";
import { ShopeeChannel } from "./channels/shopee-channel";

export enum ChannelType {
  SHOPEE = 'shopee'
  // Add more channels here as needed
  // TOKOPEDIA = 'tokopedia',
  // TIKTOK = 'tiktok'
}

export class ChannelFactory {
  private static instances: Map<ChannelType, BaseChannel> = new Map();

  static getChannel(channel: ChannelType | string): BaseChannel {
    // Handle both enum and string inputs
    let channelEnum: ChannelType;
    
    if (typeof channel === 'string') {
      if (!this.isValidChannel(channel)) {
        throw new Error(`Unsupported channel: ${channel}`);
      }
      channelEnum = channel as ChannelType;
    } else {
      channelEnum = channel;
    }

    // Singleton pattern - reuse instances
    if (!this.instances.has(channelEnum)) {
      const instance = this.createChannelInstance(channelEnum);
      this.instances.set(channelEnum, instance);
    }
    
    return this.instances.get(channelEnum)!;
  }

  private static createChannelInstance(channel: ChannelType): BaseChannel {
    switch (channel) {
      case ChannelType.SHOPEE:
        return new ShopeeChannel();
      
      // Add more channels here
      // case ChannelType.TOKOPEDIA:
      //   return new TokopediaChannel();
      
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  static isValidChannel(channelName: string): channelName is ChannelType {
    return Object.values(ChannelType).includes(channelName as ChannelType);
  }

  static getAllChannels(): ChannelType[] {
    return Object.values(ChannelType);
  }

  static getChannelNames(): string[] {
    return this.getAllChannels().map(channel => 
      this.getChannel(channel).getName()
    );
  }

  static getChannelConfigs(): Array<{ channel: ChannelType; config: any }> {
    return this.getAllChannels().map(channel => ({
      channel,
      config: this.getChannel(channel).getConfig()
    }));
  }
}

// Legacy compatibility interface for settings page
export interface ChannelInfo {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: Date;
}

// Export alias for backward compatibility  
export type Channel = ChannelInfo;

// Legacy compatibility function for settings page
export function generateChannelAuthLink(
  channelName: string, 
  params: AuthLinkParams
): AuthLinkResult {
  const channel = ChannelFactory.getChannel(channelName);
  return channel.generateAuthLink(params);
}
