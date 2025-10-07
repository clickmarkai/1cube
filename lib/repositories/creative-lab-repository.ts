import { appLogger } from "@/lib/logger";
import { db } from "@/lib/database";

export type CreativeLabSessionState = 'IN_PROGRESS' | 'COMPLETED';

export interface CreativeLabSession {
  id: string;
  user_id: string;
  state: CreativeLabSessionState;
  created_at: string;
  updated_at: string;
}

export interface CreativeLabAsset {
  id: string;
  session_id: string;
  asset: string;
  created_time: string;
  asset_type: string;
  prompt: string | null;
}

export interface CreativeLabSessionWithAssets extends CreativeLabSession {
  assets: CreativeLabAsset[];
}

export class CreativeLabRepository {
  private log = appLogger;

  /**
   * Fetch a creative lab session and all of its assets for the given user
   */
  async getSessionWithAssets(sessionId: string, userId: string): Promise<CreativeLabSessionWithAssets | null> {
    try {
      this.log.debug('Fetching creative lab session with assets', { sessionId, userId });

      const client = db.getClient();
      const { data, error } = await client
        .from('creative_lab_sessions')
        .select(`
          id,
          user_id,
          state,
          created_at,
          updated_at,
          assets:creative_lab_session_assets (
            id,
            session_id,
            asset,
            created_time,
            asset_type,
            prompt
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        this.log.error('Failed to fetch creative lab session with assets', error);
        return null;
      }

      if (!data) {
        return null;
      }

      const session: CreativeLabSessionWithAssets = {
        id: data.id,
        user_id: data.user_id,
        state: data.state,
        created_at: data.created_at,
        updated_at: data.updated_at,
        assets: (data.assets || []).map((a: any) => ({
          id: a.id,
          session_id: a.session_id,
          asset: a.asset,
          created_time: a.created_time,
          asset_type: a.asset_type,
          prompt: a.prompt ?? null,
        })),
      };

      return session;
    } catch (err) {
      this.log.error('Unexpected error fetching creative lab session with assets', err);
      return null;
    }
  }

  /**
   * Create a new creative lab session for a user
   */
  async createSession(userId: string, state: CreativeLabSessionState = 'IN_PROGRESS'): Promise<CreativeLabSession | null> {
    try {
      this.log.debug('Creating creative lab session', { userId, state });

      const client = db.getClient();
      const { data, error } = await client
        .from('creative_lab_sessions')
        .insert({ user_id: userId, state })
        .select('id,user_id,state,created_at,updated_at')
        .single();

      if (error) {
        this.log.error('Failed to create creative lab session', error);
        return null;
      }

      return data as CreativeLabSession;
    } catch (err) {
      this.log.error('Unexpected error creating creative lab session', err);
      return null;
    }
  }

  /**
   * Add a single asset to a creative lab session
   */
  async addAsset(
    sessionId: string,
    params: { asset: string; asset_type: string; prompt?: string | null }
  ): Promise<CreativeLabAsset | null> {
    try {
      this.log.debug('Adding creative lab session asset', { sessionId, ...params });

      const client = db.getClient();
      const { data, error } = await client
        .from('creative_lab_session_assets')
        .insert({
          session_id: sessionId,
          asset: params.asset,
          asset_type: params.asset_type,
          prompt: params.prompt ?? null,
        })
        .select('id,session_id,asset,created_time,asset_type,prompt')
        .single();

      if (error) {
        this.log.error('Failed to add creative lab session asset', error);
        return null;
      }

      return data as CreativeLabAsset;
    } catch (err) {
      this.log.error('Unexpected error adding creative lab session asset', err);
      return null;
    }
  }

  /**
   * Add multiple assets to a creative lab session in one request
   */
  async addAssets(
    sessionId: string,
    items: Array<{ asset: string; asset_type: string; prompt?: string | null }>
  ): Promise<CreativeLabAsset[] | null> {
    try {
      this.log.debug('Adding multiple creative lab session assets', { sessionId, count: items.length });

      if (items.length === 0) {
        return [];
      }

      const client = db.getClient();
      const payload = items.map(i => ({
        session_id: sessionId,
        asset: i.asset,
        asset_type: i.asset_type,
        prompt: i.prompt ?? null,
      }));

      const { data, error } = await client
        .from('creative_lab_session_assets')
        .insert(payload)
        .select('id,session_id,asset,created_time,asset_type,prompt');

      if (error) {
        this.log.error('Failed to add multiple creative lab session assets', error);
        return null;
      }

      return (data || []) as CreativeLabAsset[];
    } catch (err) {
      this.log.error('Unexpected error adding multiple creative lab session assets', err);
      return null;
    }
  }

  /**
   * Get the latest image asset for a session (by created_time desc)
   */
  async getLatestImageAsset(sessionId: string): Promise<CreativeLabAsset | null> {
    try {
      this.log.debug('Fetching latest image asset for session', { sessionId });

      const client = db.getClient();
      const { data, error } = await client
        .from('creative_lab_session_assets')
        .select('id,session_id,asset,created_time,asset_type,prompt')
        .eq('session_id', sessionId)
        .eq('asset_type', 'image')
        .order('created_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        this.log.error('Failed to fetch latest image asset for session', error);
        return null;
      }

      return data as CreativeLabAsset | null;
    } catch (err) {
      this.log.error('Unexpected error fetching latest image asset for session', err);
      return null;
    }
  }
}


