import { BaseAuthLinkGenerator } from './types';
import { ShopeeAuthLinkGenerator } from './shopee';

const AUTH_GENERATORS: Record<string, () => BaseAuthLinkGenerator> = {
  'shopee': () => new ShopeeAuthLinkGenerator(),
};

export class AuthGeneratorRegistry {
  
  static getGenerator(channelId: string): BaseAuthLinkGenerator | null {
    const generatorFactory = AUTH_GENERATORS[channelId];
    return generatorFactory ? generatorFactory() : null;
  }

  static hasGenerator(channelId: string): boolean {
    return channelId in AUTH_GENERATORS;
  }

  static getSupportedChannels(): string[] {
    return Object.keys(AUTH_GENERATORS);
  }

  static registerGenerator(channelId: string, generatorFactory: () => BaseAuthLinkGenerator): void {
    AUTH_GENERATORS[channelId] = generatorFactory;
  }
}

export { AUTH_GENERATORS };
