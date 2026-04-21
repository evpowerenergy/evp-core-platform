
export interface SalesTeamMember {
  id: number;
  name: string;
  email: string;
  status: string;
  current_leads: number;
  deals_closed: number;
  pipeline_value: number;
  conversion_rate: number;
  total_leads: number; // Add total leads for team calculation
  rank?: number; // Optional rank field for leaderboard functionality
}

// Additional interface for the view data
export interface SalesTeamWithUserInfo {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  current_leads: number;
  status: string;
  created_at_thai?: string;
  updated_at_thai?: string;
}
