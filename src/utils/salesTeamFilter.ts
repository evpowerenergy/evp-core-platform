/**
 * Utility functions for filtering sales team members in filter dropdowns
 */

import { SalesTeamWithUserInfo } from "@/types/salesTeam";

/**
 * Groups sales team members into current (active) and archived (inactive/old) members
 * Uses status field to determine grouping
 * 
 * @param salesTeam - Array of sales team members
 * @returns Object with currentMembers and archivedMembers arrays
 */
export function groupSalesTeamByStatus(
  salesTeam: SalesTeamWithUserInfo[]
): {
  currentMembers: SalesTeamWithUserInfo[];
  archivedMembers: SalesTeamWithUserInfo[];
} {
  // Separate into current (active) and archived (inactive) members based on status
  const currentMembers = salesTeam.filter(
    (member) => member.status === 'active'
  );
  
  const archivedMembers = salesTeam.filter(
    (member) => member.status !== 'active'
  );
  
  return {
    currentMembers,
    archivedMembers
  };
}

/**
 * Filters sales team members to only show active members
 * 
 * @param salesTeam - Array of sales team members
 * @returns Filtered array containing only active members
 */
export function getActiveSalesTeamForFilter(
  salesTeam: SalesTeamWithUserInfo[]
): SalesTeamWithUserInfo[] {
  return salesTeam.filter(
    (member) => member.status === 'active'
  );
}

