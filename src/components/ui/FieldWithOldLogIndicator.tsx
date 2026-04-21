import React from 'react';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldWithOldLogIndicatorProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  isFromOldLog?: boolean;
  className?: string;
}

export const FieldWithOldLogIndicator: React.FC<FieldWithOldLogIndicatorProps> = ({
  label,
  htmlFor,
  children,
  isFromOldLog = false,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {isFromOldLog && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            ข้อมูลจาก Log เก่า
          </Badge>
        )}
      </div>
      <div className={cn(
        "transition-colors duration-200",
        isFromOldLog ? "ring-1 ring-blue-200 rounded-md" : ""
      )}>
        {children}
      </div>
    </div>
  );
};

export default FieldWithOldLogIndicator;
