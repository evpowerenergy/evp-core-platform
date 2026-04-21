import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { getActivityIcon } from "@/utils/leadTimelineUtils";
import ContactInfoSection from './activity-sections/ContactInfoSection';
import CustomerInfoSection from './activity-sections/CustomerInfoSection';
import SiteVisitInfoSection from './activity-sections/SiteVisitInfoSection';
import QuotationInfoSection from './activity-sections/QuotationInfoSection';
import SalesOpportunitySection from './activity-sections/SalesOpportunitySection';
import ActivityHeader from './activity-sections/ActivityHeader';
import BasicActivityInfo from './activity-sections/BasicActivityInfo';
import NotesAndTags from './activity-sections/NotesAndTags';
import EditProductivityLogDialog from './EditProductivityLogDialog';

interface TimelineActivity {
  id: number;
  created_at_thai: string;
  status: string | null;
  note: string | null;
  next_follow_up: string | null;
  next_follow_up_thai: string | null;
  next_follow_up_details: string | null;

  appointments: any[] | null;
  quotations: any[] | null;
  quotation_documents: any[] | null;
  credit_evaluation: any[] | null;
  lead_products: any[] | null;
  contact_status: string | null;
  contact_fail_reason: string | null;
  lead_group: string | null;
  customer_category: string | null;
  presentation_type: string | null;
  interested_kw_size: string | null;
  building_info: string | null;
  installation_notes: string | null;
  can_issue_qt: boolean | null;
  qt_fail_reason: string | null;
  sale_chance_percent: number | null;
  sale_chance_status: string | null;
  credit_approval_status: string | null;
  cxl_group: string | null;
  cxl_reason: string | null;
  cxl_detail: string | null;
  sale_id?: number | null;
  sale_name?: string | null;
}

interface TimelineActivityProps {
  activity: TimelineActivity;
  isLast: boolean;
  followupRound: number;
  leadId?: number;
  isWholesale?: boolean;
  isPackage?: boolean;
}

const TimelineActivity = ({ activity, isLast, followupRound, leadId, isWholesale, isPackage }: TimelineActivityProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const IconComponent = getActivityIcon(activity.status);

  return (
    <div className="relative mb-8">
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-blue-200 to-gray-200"></div>
      )}
      
      <div className="flex gap-6">
        {/* Timeline Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white relative shadow-lg">
          <IconComponent className="h-5 w-5" />
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md">
            {followupRound}
          </div>
        </div>
        
        {/* Card Content */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="p-6">
              {/* Header Section */}
              <div className="border-b border-gray-100 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <ActivityHeader activity={activity} followupRound={followupRound} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    แก้ไข
                  </Button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <BasicActivityInfo 
                    nextFollowUp={activity.next_follow_up_thai || activity.next_follow_up} 
                    nextFollowUpDetails={activity.next_follow_up_details}
                  />
                  
                  <ContactInfoSection 
                    contactStatus={activity.contact_status}
                    contactFailReason={activity.contact_fail_reason}
                  />

                  <CustomerInfoSection 
                    leadGroup={activity.lead_group}
                    customerCategory={activity.customer_category}
                    presentationType={activity.presentation_type}
                    interestedKwSize={activity.interested_kw_size}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* เงื่อนไข: ถ้าเป็น wholesale (มี lead_products) ให้แสดงตารางสินค้าแทน SiteVisitInfoSection */}
                  {activity.lead_products && activity.lead_products.length > 0 ? (
                    <div className="bg-blue-50 p-3 rounded-lg mb-3 overflow-x-auto">
                      <div className="font-medium text-blue-900 mb-2">รายการสินค้า/อุปกรณ์ที่เสนอขาย</div>
                      <table className="min-w-full text-xs md:text-sm">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="px-2 py-1">ชื่ออุปกรณ์</th>
                            <th className="px-2 py-1">จำนวน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.lead_products.map((item: any) => (
                            <tr key={item.id} className="border-b">
                              <td className="px-2 py-1">{item.products?.name || '-'}</td>
                              <td className="px-2 py-1 text-center">{item.quantity || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <SiteVisitInfoSection 
                      appointments={activity.appointments}
                      buildingInfo={activity.building_info}
                      installationNotes={activity.installation_notes}
                    />
                  )}

                  <QuotationInfoSection 
                    quotations={activity.quotations}
                    documents={activity.quotation_documents || []}
                    canIssueQt={activity.can_issue_qt}
                    qtFailReason={activity.qt_fail_reason}
                    productivityLogId={activity.id}
                    isZeroDownPayment={activity.is_zero_down_payment}
                    downPaymentAmount={activity.down_payment_amount}
                  />

                  <SalesOpportunitySection 
                    saleChanceStatus={activity.sale_chance_status}
                    creditApprovalStatus={activity.credit_approval_status}
                    cxlReason={activity.cxl_reason}
                    cxlDetail={activity.cxl_detail}
                  />
                </div>
              </div>

              {/* Bottom Section - Notes and Tags */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <NotesAndTags 
                  note={activity.note}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {leadId && (
        <EditProductivityLogDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          logId={activity.id}
          leadId={leadId}
          isWholesale={isWholesale}
          isPackage={isPackage}
        />
      )}
    </div>
  );
};

export default TimelineActivity;
