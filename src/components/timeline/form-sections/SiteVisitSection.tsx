
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DateTimePicker from "@/components/ui/DateTimePicker";

interface SiteVisitSectionProps {
  siteVisitDate: string;
  location: string;
  buildingInfo: string;
  installationNotes: string;
  onSiteVisitDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onBuildingInfoChange: (value: string) => void;
  onInstallationNotesChange: (value: string) => void;
}

const SiteVisitSection = ({
  siteVisitDate,
  location,
  buildingInfo,
  installationNotes,
  onSiteVisitDateChange,
  onLocationChange,
  onBuildingInfoChange,
  onInstallationNotesChange
}: SiteVisitSectionProps) => {
  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">4. นัดหมายวิศวกร</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <DateTimePicker
            label="วันที่ลงพื้นที่"
            value={siteVisitDate}
            onChange={onSiteVisitDateChange}
            placeholder="เลือกวันที่และเวลาลงพื้นที่"
          />
        </div>

        <div className="space-y-2">
          <Label>สถานที่</Label>
          <Input
            placeholder="ระบุสถานที่..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>รายละเอียดอาคาร</Label>
        <Textarea
          placeholder="รายละเอียดอาคาร/สถานที่ติดตั้ง..."
          value={buildingInfo}
          onChange={(e) => onBuildingInfoChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>หมายเหตุหน้างาน</Label>
        <Textarea
          placeholder="หมายเหตุการติดตั้ง/หน้างาน..."
          value={installationNotes}
          onChange={(e) => onInstallationNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
};

export default SiteVisitSection;
