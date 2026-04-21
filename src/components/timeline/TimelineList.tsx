
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus } from "lucide-react";
import TimelineActivity from './TimelineActivity';

interface TimelineListProps {
  timeline: any[];
  onAddLog: () => void;
  leadId?: number;
  isWholesale?: boolean;
  isPackage?: boolean;
}

const TimelineList = ({ timeline, onAddLog, leadId, isWholesale, isPackage }: TimelineListProps) => {
  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการติดตาม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประวัติการติดตาม</h3>
            <p className="text-gray-600 mb-4">เริ่มต้นบันทึกการติดตามลีดรายนี้</p>
            <Button onClick={onAddLog}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มการติดตามแรก
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ประวัติการติดตาม</CardTitle>
          <div className="text-sm text-gray-500">
            รวม {timeline.length} ครั้ง
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timeline.map((activity, index) => (
            <TimelineActivity
              key={activity.id}
              activity={activity}
              isLast={index === timeline.length - 1}
              followupRound={timeline.length - index}
              leadId={leadId}
              isWholesale={isWholesale}
              isPackage={isPackage}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineList;
