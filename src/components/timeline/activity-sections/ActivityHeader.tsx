import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Hash, User } from "lucide-react";
import { getActivityIcon, getActivityTitle } from "@/utils/leadTimelineUtils";
import { formatDate, formatTime } from "@/utils/dashboardUtils";

interface ActivityHeaderProps {
  activity: any;
  followupRound: number;
}
// test sync with Lovable
const ActivityHeader = ({ activity, followupRound }: ActivityHeaderProps) => {
  const IconComponent = getActivityIcon(activity);

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">
              {getActivityTitle(activity)}
            </h4>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <div className="flex items-center gap-2">
                <Hash className="h-3 w-3" />
                <span>การติดตามครั้งที่ {followupRound}</span>
              </div>
              {activity.sale_name && (
                <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full">
                  <User className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-700 font-medium">สร้างโดย {activity.sale_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
              <Calendar className="h-3 w-3" />
              <span>{(() => {
                return formatDate(activity.created_at_thai);
              })()}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{(() => {
                return formatTime(activity.created_at_thai);
              })()}</span>
            </div>
        </div>
      </div>
      
      {activity.status && (
        <Badge 
          variant="outline" 
          className="font-medium px-3 py-1 border-2 bg-white shadow-sm"
        >
          {activity.status}
        </Badge>
      )}
    </div>
  );
};

export default ActivityHeader;
