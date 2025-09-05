import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { channelsLogger } from '../logger';

export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: SupabaseClient | null = null;
  private config: DatabaseConfig | null = null;
  private isInitialized = false;

  private constructor() {
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public initialize(config?: DatabaseConfig): void {
    if (this.isInitialized) {
      channelsLogger.debug('Database connection already initialized');
      return;
    }

    try {
      this.config = config || {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      };

      if (!this.config.url || !this.config.anonKey) {
        throw new Error('Missing required Supabase configuration: URL and anon key are required');
      }

      this.client = createClient(this.config.url, this.config.anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      this.isInitialized = true;
      channelsLogger.info('✅ Database connection initialized successfully');
    } catch (error) {
      channelsLogger.error('❌ Failed to initialize database connection:', error);
      throw error;
    }
  }

  public getClient(): SupabaseClient {
    if (!this.isInitialized || !this.client) {
      this.initialize();
    }

    if (!this.client) {
      throw new Error('Database client is not available. Check your configuration.');
    }

    return this.client;
  }
}

export const db = DatabaseConnection.getInstance();

db.initialize();
