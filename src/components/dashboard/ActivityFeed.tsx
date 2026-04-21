
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, UserPlus, Clock, Eye } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'deal_closed' | 'lead_assigned' | 'follow_up' | 'lead_viewed';
  message: string;
  timestamp: string;
  member_name: string;
  status?: string;
}

const ActivityFeed = () => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      try {
        // ดึงข้อมูลทั้งหมดพร้อมกันด้วย Promise.all
        const [closedLeads, salesTeamInfo, recentAssignments, recentFollowUps] = await Promise.all([
          // Get recent closed deals
          supabase
            .from('leads')
            .select('id, full_name, display_name, sale_owner_id, updated_at_thai')
            .eq('status', 'ปิดการขาย')
            .order('updated_at_thai', { ascending: false })
            .limit(10),

          // Get sales team info
          supabase
            .from('sales_team_with_user_info')
            .select('id, name'),

          // Get recent lead assignments
          supabase
            .from('leads')
            .select('id, full_name, display_name, sale_owner_id, created_at_thai')
            .not('sale_owner_id', 'is', null)
            .order('created_at_thai', { ascending: false })
            .limit(15),

          // Get recent follow-ups
          supabase
            .from('lead_productivity_logs')
            .select(`
              id, created_at_thai, next_follow_up_thai,
              leads (id, full_name, display_name, sale_owner_id)
            `)
            .not('next_follow_up', 'is', null)
            .order('created_at_thai', { ascending: false })
            .limit(10)
        ]);

        const activities: ActivityItem[] = [];
        const salesTeamMap = new Map(salesTeamInfo.data?.map(member => [member.id, member]) || []);

        // Process closed deals
        closedLeads.data?.forEach(lead => {
          const salesMember = lead.sale_owner_id ? salesTeamMap.get(lead.sale_owner_id) : null;
          activities.push({
            id: `deal_${lead.id}`,
            type: 'deal_closed',
            message: `ปิดดีลสำเร็จ: ${lead.full_name || lead.display_name}`,
            timestamp: lead.updated_at_thai,
            member_name: salesMember?.name || 'ไม่ระบุ',
            status: 'สำเร็จ'
          });
        });

        // Process recent assignments
        recentAssignments.data?.forEach(lead => {
          const salesMember = lead.sale_owner_id ? salesTeamMap.get(lead.sale_owner_id) : null;
          activities.push({
            id: `assigned_${lead.id}`,
            type: 'lead_assigned',
            message: `ได้รับมอบหมายลีดใหม่: ${lead.full_name || lead.display_name}`,
            timestamp: lead.created_at_thai,
            member_name: salesMember?.name || 'ไม่ระบุ',
            status: 'มอบหมายแล้ว'
          });
        });

        // Process recent follow-ups
        recentFollowUps.data?.forEach(log => {
          const lead = log.leads;
          const salesMember = lead?.sale_owner_id ? salesTeamMap.get(lead.sale_owner_id) : null;
          activities.push({
            id: `followup_${log.id}`,
            type: 'follow_up',
            message: `ติดตามลูกค้า: ${lead?.full_name || lead?.display_name}`,
            timestamp: log.created_at_thai,
            member_name: salesMember?.name || 'ไม่ระบุ',
            status: 'กำลังติดตาม'
          });
        });

        // Sort by timestamp and limit to 20 most recent
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);

        return sortedActivities;
      } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // cache 2 นาที
    gcTime: 1000 * 60 * 10, // cache 10 นาที
    refetchOnWindowFocus: false,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deal_closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'lead_assigned':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'follow_up':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'lead_viewed':
        return <Eye className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'สำเร็จ':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'มอบหมายแล้ว':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'กำลังติดตาม':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'เมื่อสักครู่';
    } else if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่แล้ว`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} วันที่แล้ว`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            กิจกรรมล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            กำลังโหลดกิจกรรม...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          กิจกรรมล่าสุด
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      โดย: {activity.member_name}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {activity.status && (
                      <Badge className={`text-xs ${getStatusBadgeColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่มีกิจกรรมล่าสุด
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
