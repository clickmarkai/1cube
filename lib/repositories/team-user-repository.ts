/**
 * Team-User Repository
 * Manages relationships between teams and users using Supabase
 */

import { teamLogger } from '../logger';
import { db } from '../database';

export interface TeamUser {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  invited_by?: string;
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class TeamUserRepository {
  /**
   * Get team ID for a user (assuming user belongs to one team)
   */
  async getTeamIdByUserId(userId: string): Promise<string | null> {
    try {
      teamLogger.debug('user id', userId);
      const { data, error } = await db.getClient()
        .from('team_users')
        .select('team_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user not in any team
          return null;
        }
        teamLogger.error('Error fetching team for user:', error);
        throw new Error(`Failed to fetch team for user: ${error.message}`);
      }

      return data?.team_id || null;
    } catch (error) {
      teamLogger.error('TeamUserRepository.getTeamIdByUserId error:', error);
      throw error;
    }
  }

  /**
   * Get all teams for a user
   */
  async getTeamsByUserId(userId: string): Promise<TeamUser[]> {
    try {
      const { data, error } = await db.getClient()
        .from('team_users')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        teamLogger.error('Error fetching teams for user:', error);
        throw new Error(`Failed to fetch teams for user: ${error.message}`);
      }

      return (data || []).map((tu: any) => ({
        id: tu.id,
        team_id: tu.team_id,
        user_id: tu.user_id,
        role: tu.role,
        invited_by: tu.invited_by,
        joined_at: new Date(tu.joined_at),
        created_at: new Date(tu.created_at),
        updated_at: new Date(tu.updated_at)
      }));
    } catch (error) {
      teamLogger.error('TeamUserRepository.getTeamsByUserId error:', error);
      throw error;
    }
  }

  /**
   * Get all users in a team
   */
  async getUsersByTeamId(teamId: string): Promise<TeamUser[]> {
    try {
      const { data, error } = await db.getClient()
        .from('team_users')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        teamLogger.error('Error fetching users for team:', error);
        throw new Error(`Failed to fetch users for team: ${error.message}`);
      }

      return (data || []).map((tu: any) => ({
        id: tu.id,
        team_id: tu.team_id,
        user_id: tu.user_id,
        role: tu.role,
        invited_by: tu.invited_by,
        joined_at: new Date(tu.joined_at),
        created_at: new Date(tu.created_at),
        updated_at: new Date(tu.updated_at)
      }));
    } catch (error) {
      teamLogger.error('TeamUserRepository.getUsersByTeamId error:', error);
      throw error;
    }
  }

  /**
   * Add user to team
   */
  async addUserToTeam(teamId: string, userId: string, role: string = 'member', invitedBy?: string): Promise<TeamUser> {
    try {
      const { data, error } = await db.getClient()
        .from('team_users')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          invited_by: invitedBy
        })
        .select()
        .single();

      if (error) {
        teamLogger.error('Error adding user to team:', error);
        throw new Error(`Failed to add user to team: ${error.message}`);
      }

      return {
        id: data.id,
        team_id: data.team_id,
        user_id: data.user_id,
        role: data.role,
        invited_by: data.invited_by,
        joined_at: new Date(data.joined_at),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      teamLogger.error('TeamUserRepository.addUserToTeam error:', error);
      throw error;
    }
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await db.getClient()
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        teamLogger.error('Error removing user from team:', error);
        throw new Error(`Failed to remove user from team: ${error.message}`);
      }

      return true;
    } catch (error) {
      teamLogger.error('TeamUserRepository.removeUserFromTeam error:', error);
      return false;
    }
  }

  /**
   * Update user role in team
   */
  async updateUserRole(teamId: string, userId: string, role: string): Promise<TeamUser | null> {
    try {
      const { data, error } = await db.getClient()
        .from('team_users')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        teamLogger.error('Error updating user role:', error);
        throw new Error(`Failed to update user role: ${error.message}`);
      }

      return {
        id: data.id,
        team_id: data.team_id,
        user_id: data.user_id,
        role: data.role,
        invited_by: data.invited_by,
        joined_at: new Date(data.joined_at),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      teamLogger.error('TeamUserRepository.updateUserRole error:', error);
      throw error;
    }
  }

  /**
   * Check if user exists in team
   */
  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await db.getClient()
        .from('team_users')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        teamLogger.error('Error checking user in team:', error);
        throw new Error(`Failed to check user in team: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      teamLogger.error('TeamUserRepository.isUserInTeam error:', error);
      return false;
    }
  }

  /**
   * Get user role in team
   */
  async getUserRoleInTeam(teamId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await db.getClient()
        .from('team_users')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        teamLogger.error('Error fetching user role in team:', error);
        throw new Error(`Failed to fetch user role in team: ${error.message}`);
      }

      return data?.role || null;
    } catch (error) {
      teamLogger.error('TeamUserRepository.getUserRoleInTeam error:', error);
      return null;
    }
  }
}

// Legacy compatibility export
export const TeamUserService = new TeamUserRepository();
