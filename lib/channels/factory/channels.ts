/**
 * Channel Factory - NEW ARCHITECTURE
 * Factory pattern implementation for managing different marketplace channels
 */

import { BaseChannel, type AuthLinkParams, type AuthLinkResult } from "../interface/channel-base";
import { ShopeeChannel } from "../shopee-channel";
import { TikTokChannel } from "../tiktok-channel";
import { TikTokShopChannel } from "../tiktok-shop-channel";
import { channelsLogger } from "../../logger";

/**
 * Channel information for UI display
 */
export interface ChannelInfo {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: Date;
}

/**
 * Factory for creating and managing channel instances
 */
export class ChannelFactory {
  private static channels: Map<string, BaseChannel> = new Map();

  /**
   * Get or create a channel instance
   */
  static getChannel(channelName: string): BaseChannel | null {
    const normalizedName = channelName.toLowerCase();
    
    // Return existing instance if available
    if (this.channels.has(normalizedName)) {
      return this.channels.get(normalizedName)!;
    }

    // Create new instance based on channel name
    let channel: BaseChannel | null = null;
    
    switch (normalizedName) {
      case 'shopee':
        channel = new ShopeeChannel();
        break;
      case 'tiktok':
        channel = new TikTokChannel();
        break;
      case 'tiktok shop':
        channel = new TikTokShopChannel();
        break;
      default:
        channelsLogger.warn(`Unknown channel requested: ${channelName}`);
        return null;
    }

    // Cache the instance
    this.channels.set(normalizedName, channel);
    return channel;
  }

  /**
   * Get all available channel names
   */
  static getAvailableChannels(): string[] {
    return ['shopee', 'tiktok', 'tiktok shop'];
  }

  /**
   * Generate authentication link for a channel
   */
  static async generateAuthLink(
    channelName: string, 
    params: AuthLinkParams
  ): Promise<AuthLinkResult | null> {
    const channel = this.getChannel(channelName);
    if (!channel) {
      return null;
    }

    try {
      return await channel.generateAuthLink(params);
    } catch (error) {
      channelsLogger.error(`Failed to generate auth link for ${channelName}:`, error);
      return null;
    }
  }

  /**
   * Clear cached channel instances (useful for testing or config changes)
   */
  static clearCache(): void {
    this.channels.clear();
  }

  /**
   * Get channel configuration
   */
  static getChannelConfig(channelName: string) {
    const channel = this.getChannel(channelName);
    return channel?.getConfig() || null;
  }
}

// Export for backward compatibility and convenience
export { BaseChannel };
export type { AuthLinkParams, AuthLinkResult };
