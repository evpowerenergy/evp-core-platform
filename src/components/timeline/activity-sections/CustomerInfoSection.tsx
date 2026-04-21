
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface CustomerInfoSectionProps {
  leadGroup: string | null;
  customerCategory: string | null;
  presentationType: string | null;
  interestedKwSize: string | null;
}

const CustomerInfoSection = ({ leadGroup, customerCategory, presentationType, interestedKwSize }: CustomerInfoSectionProps) => {
  if (!leadGroup && !customerCategory && !presentationType && !interestedKwSize) return null;
  
  return (
    <div className="bg-green-50 p-3 rounded-lg mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-green-600" />
        <span className="font-medium text-green-900">ข้อมูลลูกค้า</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {leadGroup && (
          <div>
            <span className="text-gray-600">กลุ่มลีด: </span>
            <Badge variant="outline">{leadGroup}</Badge>
          </div>
        )}
        {customerCategory && (
          <div>
            <span className="text-gray-600">หมวดลูกค้า: </span>
            <Badge variant="outline">{customerCategory}</Badge>
          </div>
        )}
        {presentationType && (
          <div>
            <span className="text-gray-600">ประเภทการนำเสนอ: </span>
            <Badge variant="outline">{presentationType}</Badge>
          </div>
        )}
        {interestedKwSize && (
          <div>
            <span className="text-gray-600">สนใจขนาด: </span>
            <Badge variant="outline">{interestedKwSize}</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInfoSection;
