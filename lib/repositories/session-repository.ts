/**
 * Session Repository
 * Centralized session state management for OAuth flows across all channels
 */

import { channelsLogger } from "@/lib/logger";
import { db } from "../database";

export interface SessionState {
  state: string;
  userId: string;
  channelName: string;
  codeVerifier?: string;
  timestamp: number;
  expiresAt?: Date;
}

export interface SessionVerificationResult {
  valid: boolean;
  error?: string;
  userId?: string;
}

// Global type declarations for OAuth state storage (legacy support)
declare global {
  var oauthStates: Map<string, {
    state: string;
    userId: string;
    channelName: string;
    timestamp: number;
    codeVerifier?: string;
  }> | undefined;
}

export class SessionRepository {

  /**
   * Store session state with code verifier in database
   */
  async storeSessionState(
    state: string, 
    userId: string, 
    channelName: string, 
    codeVerifier?: string
  ): Promise<void> {
    try {
      channelsLogger.debug(`📦 Storing session state in DB - State: ${state}, UserId: ${userId}, Channel: ${channelName}`);

      const { error } = await db.getClient()
        .from('user_state')
        .insert({
          state,
          user_id: userId,
          channel_name: channelName,
          code_verifier: codeVerifier
        });

      if (error) {
        throw new Error(`Database storage failed: ${error.message}`);
      }

      channelsLogger.info(`✅ Stored OAuth state for ${channelName} channel, user ${userId} in database`);
    } catch (error) {
      channelsLogger.error('❌ Error storing session state in database:', error);
      throw error; // Re-throw to prevent auth link generation if storage fails
    }
  }

  /**
   * Verify session state from database
   */
  async verifySessionState(state: string): Promise<SessionVerificationResult> {
    try {
      channelsLogger.debug(`🔍 Verifying session state from database: ${state}`);

      // Fetch state from database
      const { data: states, error } = await db.getClient()
        .from('user_state')
        .select('user_id,channel_name,expires_at,code_verifier')
        .eq('state', state);

      if (error) {
        channelsLogger.error('❌ Database query failed:', error);
        return { valid: false, error: 'Database verification failed' };
      }

      if (!states || states.length === 0) {
        channelsLogger.warn('❌ OAuth state not found in database');
        return { valid: false, error: 'OAuth state not found - session may have expired' };
      }

      const storedState = states[0];

      // Check if state has expired
      if (new Date(storedState.expires_at) < new Date()) {
        channelsLogger.warn('❌ OAuth state expired');
        // Clean up expired state
        await this.deleteExpiredState(state);
        return { valid: false, error: 'OAuth state expired - please try again' };
      }

      channelsLogger.info(`✅ Verified OAuth state for ${storedState.channel_name} channel, user ${storedState.user_id}`);

      return { valid: true, userId: storedState.user_id };
    } catch (error) {
      channelsLogger.error('❌ Error verifying session state:', error);
      return { valid: false, error: 'Error verifying OAuth state' };
    }
  }

  /**
   * Get code verifier for a specific state
   */
  async getCodeVerifier(state: string): Promise<string | null> {
    try {
      channelsLogger.debug(`🔑 Retrieving code verifier for state: ${state}`);

      const { data: states, error } = await db.getClient()
        .from('user_state')
        .select('code_verifier')
        .eq('state', state);

      if (error) {
        channelsLogger.error('❌ Failed to retrieve code verifier:', error);
        return null;
      }

      if (!states || states.length === 0 || !states[0].code_verifier) {
        channelsLogger.warn('❌ Code verifier not found for state');
        return null;
      }

      channelsLogger.debug('✅ Code verifier found');
      return states[0].code_verifier;
    } catch (error) {
      channelsLogger.error('❌ Error retrieving code verifier:', error);
      return null;
    }
  }

  /**
   * Delete expired state from database
   */
  async deleteExpiredState(state: string): Promise<void> {
    try {
      const { error } = await db.getClient()
        .from('user_state')
        .delete()
        .eq('state', state);

      if (error) {
        throw error;
      }

      channelsLogger.info(`🗑️ Deleted expired state from database: ${state}`);
    } catch (error) {
      channelsLogger.error('❌ Error deleting expired state:', error);
    }
  }

  /**
   * Clean up all expired states from database
   */
  async cleanupExpiredStates(): Promise<void> {
    try {
      const { error } = await db.getClient()
        .from('user_state')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      channelsLogger.info(`🧹 Cleaned up expired OAuth states from database`);
    } catch (error) {
      channelsLogger.error('❌ Error cleaning up expired states:', error);
    }
  }

  /**
   * Test session state storage functionality
   */
  async testSessionStateStorage(userId: string, channelName: string): Promise<{ success: boolean; details: string }> {
    try {
      const testState = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testVerifier = 'test_verifier_' + Date.now();

      channelsLogger.debug('🧪 Testing session state storage...');

      // Test storage
      await this.storeSessionState(testState, userId, channelName, testVerifier);

      // Test code verifier retrieval
      const retrievedVerifier = await this.getCodeVerifier(testState);
      if (retrievedVerifier !== testVerifier) {
        return { success: false, details: 'Code verifier mismatch' };
      }

      // Test verification
      const verification = await this.verifySessionState(testState);
      if (!verification.valid) {
        return { success: false, details: 'State verification failed: ' + verification.error };
      }

      // Cleanup test data
      await this.deleteExpiredState(testState);

      channelsLogger.info('✅ Session state storage test passed');
      return { success: true, details: 'All tests passed' };
    } catch (error) {
      channelsLogger.error('❌ Session state storage test failed:', error);
      return { success: false, details: 'Exception: ' + (error as Error).message };
    }
  }

  // Legacy methods for backward compatibility with in-memory storage

  /**
   * Store session state in memory (legacy method)
   */
  storeSessionStateInMemory(sessionState: SessionState): void {
    try {
      if (!global.oauthStates) {
        global.oauthStates = new Map();
      }

      const legacyState = {
        state: sessionState.state,
        userId: sessionState.userId,
        channelName: sessionState.channelName,
        timestamp: sessionState.timestamp,
        codeVerifier: sessionState.codeVerifier
      };

      global.oauthStates.set(sessionState.state, legacyState);
      channelsLogger.debug(`Stored OAuth state in memory for ${sessionState.channelName} channel, user ${sessionState.userId}`);
    } catch (error) {
      channelsLogger.error('Error storing session state in memory:', error);
    }
  }

  /**
   * Get session state from memory (legacy method)
   */
  getSessionStateFromMemory(state: string): SessionState | undefined {
    try {
      if (!global.oauthStates) {
        return undefined;
      }
      const legacyState = global.oauthStates.get(state);
      if (!legacyState) {
        return undefined;
      }

      return {
        state: legacyState.state,
        userId: legacyState.userId,
        channelName: legacyState.channelName,
        timestamp: legacyState.timestamp,
        codeVerifier: legacyState.codeVerifier
      };
    } catch (error) {
      channelsLogger.error('Error retrieving session state from memory:', error);
      return undefined;
    }
  }

  /**
   * Store code verifier in existing memory state (legacy method)
   */
  storeCodeVerifierInMemory(state: string, codeVerifier: string): void {
    try {
      if (!global.oauthStates) {
        global.oauthStates = new Map();
      }

      const existingState = global.oauthStates.get(state);
      if (existingState) {
        existingState.codeVerifier = codeVerifier;
        global.oauthStates.set(state, existingState);
      } else {
        channelsLogger.warn(`State ${state} not found when trying to store code verifier`);
      }
      channelsLogger.debug(`Stored PKCE code verifier for state ${state}`);
    } catch (error) {
      channelsLogger.error('Error storing code verifier in memory:', error);
    }
  }
}
