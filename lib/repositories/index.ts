/**
 * Repository Index
 * Central export point for all repository classes
 */

// Database connection
export { db, DatabaseConnection } from '../database';
export type { DatabaseConfig } from '../database';

// Repository classes
export { ChannelRepository, ChannelService, ChannelTypesService } from './channel-repository';
export { TeamChannelRepository, TeamChannelService } from './team-channel-repository';
export { TeamUserRepository, TeamUserService } from './team-user-repository';
export { SessionRepository } from './session-repository';

// Type exports
export type { ChannelType } from './channel-repository';
export type { TeamChannelConfig } from './team-channel-repository';
export type { TeamUser } from './team-user-repository';
export type { SessionState, SessionVerificationResult } from './session-repository';

// Re-export for convenience
export * from './channel-repository';
export * from './team-channel-repository';
export * from './team-user-repository';
export * from './session-repository';
