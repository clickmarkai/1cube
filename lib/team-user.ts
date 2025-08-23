/**
 * Team-User Service
 * Manages relationships between teams and users using Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export const TeamUserService = {
  /**
   * Get team ID for a user (assuming user belongs to one team)
   */
  async getTeamIdByUserId(userId: string): Promise<string | null> {
    try {
      console.log('user id', userId);
      const { data, error } = await supabase
        .from('team_users')
        .select('team_id')
        .eq('user_id', userId)
        .single();


      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user not in any team
          return null;
        }
        console.error('Error fetching team for user:', error);
        throw new Error(`Failed to fetch team for user: ${error.message}`);
      }

      return data?.team_id || null;
    } catch (error) {
      console.error('TeamUserService.getTeamIdByUserId error:', error);
      throw error;
    }
  },

  /**
   * Get all teams for a user
   */
  async getTeamsByUserId(userId: string): Promise<TeamUser[]> {
    try {
      const { data, error } = await supabase
        .from('team_users')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching teams for user:', error);
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
      console.error('TeamUserService.getTeamsByUserId error:', error);
      throw error;
    }
  },

  /**
   * Get all users in a team
   */
  async getUsersByTeamId(teamId: string): Promise<TeamUser[]> {
    try {
      const { data, error } = await supabase
        .from('team_users')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching users for team:', error);
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
      console.error('TeamUserService.getUsersByTeamId error:', error);
      throw error;
    }
  },

  /**
   * Add user to team
   */
  async addUserToTeam(teamId: string, userId: string, role: string = 'member', invitedBy?: string): Promise<TeamUser> {
    try {
      const { data, error } = await supabase
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
        console.error('Error adding user to team:', error);
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
      console.error('TeamUserService.addUserToTeam error:', error);
      throw error;
    }
  },

  /**
   * Remove user from team
   */
  async removeUserFromTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user from team:', error);
        throw new Error(`Failed to remove user from team: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('TeamUserService.removeUserFromTeam error:', error);
      return false;
    }
  },

  /**
   * Update user role in team
   */
  async updateUserRole(teamId: string, userId: string, role: string): Promise<TeamUser | null> {
    try {
      const { data, error } = await supabase
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
        console.error('Error updating user role:', error);
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
      console.error('TeamUserService.updateUserRole error:', error);
      throw error;
    }
  }
};
