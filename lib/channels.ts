/**
 * Object-Oriented Channel Factory System
 * Factory pattern with abstract base class and concrete implementations
 */

import { BaseChannel, type AuthLinkParams, type AuthLinkResult } from "./channel-base";
import { ShopeeChannel } from "./channels/shopee-channel";
import { TikTokChannel } from "./channels/tiktok-channel";
import { TikTokShopChannel } from "./channels/tiktok-shop-channel";

export enum ChannelType {
  SHOPEE = 'shopee',
  TIKTOK = 'tiktok',
  TIKTOK_SHOP = 'tiktok shop'
}

export class ChannelFactory {
  private static instances: Map<ChannelType, BaseChannel> = new Map();

  static getChannel(channel: ChannelType | string): BaseChannel {
    let channelEnum: ChannelType;

    if (typeof channel === 'string') {
      if (!this.isValidChannel(channel)) {
        throw new Error(`Unsupported channel: ${channel}`);
      }
      channelEnum = channel as ChannelType;
    } else {
      channelEnum = channel;
    }

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
      case ChannelType.TIKTOK:
        return new TikTokChannel();
      case ChannelType.TIKTOK_SHOP:
        return new TikTokShopChannel();

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

export interface ChannelInfo {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: Date;
}

export type Channel = ChannelInfo;

export async function generateChannelAuthLink(
  channelName: string,
  params: AuthLinkParams
): Promise<AuthLinkResult> {
  const channel = ChannelFactory.getChannel(channelName);
  return await channel.generateAuthLink(params);
}
