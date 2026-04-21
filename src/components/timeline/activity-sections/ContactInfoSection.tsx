
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";

interface ContactInfoSectionProps {
  contactStatus: string | null;
  contactFailReason: string | null;
}

const ContactInfoSection = ({ contactStatus, contactFailReason }: ContactInfoSectionProps) => {
  if (!contactStatus) return null;
  
  return (
    <div className="bg-blue-50 p-3 rounded-lg mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Phone className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-blue-900">ข้อมูลการติดต่อ</span>
      </div>
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-gray-600">สถานะการติดต่อ: </span>
          <Badge variant={contactStatus === 'ติดต่อได้' ? 'default' : 'destructive'}>
            {contactStatus}
          </Badge>
        </div>
        {contactFailReason && (
          <div>
            <span className="text-gray-600">เหตุผลที่ติดต่อไม่ได้: </span>
            <span className="text-red-600">{contactFailReason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInfoSection;
