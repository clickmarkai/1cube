export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  shopId?: string;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: any;
}

export interface BaseChannel {
  id: number;
  channelId: number;
  name: string;
  icon: string;
  connected: boolean;
  userId: string;
  lastSync?: Date;
  credentials?: ChannelCredentials;
  description?: string;
  authType: AuthType;
  requiredCredentials: string[];
  optionalCredentials?: string[];
}

export interface ChannelDefinition {
  id: number;
  name: string;
  icon: string;
  description?: string;
  authType: AuthType;
  requiredCredentials: string[];
  optionalCredentials?: string[];
}

export interface UserChannel {
  id: number;
  channelId: number;
  userId: string;
  lastSync?: Date;
  credentials?: ChannelCredentials;
}



export enum AuthType {
  OAUTH = 'oauth',
  API_KEY = 'api_key'
}



export interface ChannelAuthConfig {
  authUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUrl?: string;
}

export type Channel = BaseChannel;

export type AvailableChannel = ChannelDefinition;
