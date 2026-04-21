import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { useLeadDetailAPI, useLeadLatestLogAPI, useUpdateLeadAPI } from "@/hooks/useLeadDetailAPI";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X, Eye } from "lucide-react";
import LatestLeadLogCard from "../components/timeline/LatestLeadLogCard";
import ImageViewer from "@/components/ui/image-viewer";
import { PageLoading } from "@/components/ui/loading";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import AdCampaignSelect from "@/components/ads/AdCampaignSelect";

interface Lead {
  id: number;
  full_name: string;
  display_name: string;
  tel: string;
  line_id?: string;
  email?: string; // เพิ่ม email
  qr_code?: string; // เพิ่ม qr_code
  region: string;
  category: string;
  status: string;
  platform: string;
  user_id_platform?: string;
  sale_owner_id: number | null;
  ad_campaign_id: number | null;
  avg_electricity_bill: string;
  daytime_percent?: string;
  notes: string;
  operation_status: string;
  created_at_thai: string;
  updated_at_thai: string;
}

interface SalesTeamWithUserInfo {
  id: number;
  name: string;
  email: string;
  status: string;
}

// Status options
const LEAD_STATUS_OPTIONS = [
  'รอรับ',
  'อยู่ระหว่างการติดต่อ',
  'นัดหมายแล้ว',
  'เสนอราคาแล้ว',
  'ปิดการขายสำเร็จ',
  'ปิดการขายไม่สำเร็จ',
  'ยกเลิก'
];

const OPERATION_STATUS_OPTIONS = [
  'อยู่ระหว่างการติดต่อ',
  'นัดหมายแล้ว',
  'เสนอราคาแล้ว',
  'ปิดการขายสำเร็จ',
  'ปิดการขายไม่สำเร็จ',
  'ยกเลิก'
];

// Helper functions
const getLeadStatusColor = (status: string) => {
  switch (status) {
    case 'รอรับ':
      return 'bg-yellow-100 text-yellow-800';
    case 'อยู่ระหว่างการติดต่อ':
      return 'bg-blue-100 text-blue-800';
    case 'นัดหมายแล้ว':
      return 'bg-purple-100 text-purple-800';
    case 'เสนอราคาแล้ว':
      return 'bg-orange-100 text-orange-800';
    case 'ปิดการขายสำเร็จ':
      return 'bg-green-100 text-green-800';
    case 'ปิดการขายไม่สำเร็จ':
      return 'bg-red-100 text-red-800';
    case 'ยกเลิก':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getOperationStatusColor = (status: string) => {
  switch (status) {
    case 'อยู่ระหว่างการติดต่อ':
      return 'bg-blue-100 text-blue-800';
    case 'นัดหมายแล้ว':
      return 'bg-purple-100 text-purple-800';
    case 'เสนอราคาแล้ว':
      return 'bg-orange-100 text-orange-800';
    case 'ปิดการขายสำเร็จ':
      return 'bg-green-100 text-green-800';
    case 'ปิดการขายไม่สำเร็จ':
      return 'bg-red-100 text-red-800';
    case 'ยกเลิก':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [originalLead, setOriginalLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [isQRCodeViewerOpen, setIsQRCodeViewerOpen] = useState(false);

  const leadId = id ? parseInt(id, 10) : null;
  const isValidId = leadId && !isNaN(leadId);

  // Fetch lead details with Hook
  const { data: leadData, isLoading: leadLoading, error: leadError, refetch: refetchLead } = useLeadDetailAPI(leadId);

  // Fetch sales team with React Query
  const { data: salesTeam = [], isLoading: salesTeamLoading } = useQuery({
    queryKey: ['sales-team-active'],
    queryFn: async () => {
      // Get JWT token from Supabase session for Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Call Supabase Edge Function instead of local API endpoint
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-sales-team-sales-team`;
      
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales team');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sales team');
      }
      
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // cache 5 นาที
    gcTime: 1000 * 60 * 30, // cache 30 นาที
    refetchOnWindowFocus: false,
  });

  // Fetch latest lead log with Hook
  const { data: latestLog, isLoading: latestLogLoading } = useLeadLatestLogAPI(leadId);

  // Helper function to get sales owner name
  const getSalesOwnerName = (saleOwnerId: number | null) => {
    if (!saleOwnerId) return 'ยังไม่ได้มอบหมาย';
    const member = salesTeam.find(m => m.id === saleOwnerId);
    return member ? member.name : 'ไม่พบข้อมูล';
  };

  // Update local state when data is fetched
  React.useEffect(() => {
    if (leadData) {
      console.log('📋 Lead Data loaded:', {
        id: leadData.id,
        ad_campaign_id: leadData.ad_campaign_id,
        fullData: leadData
      });
      setLead(leadData);
      setOriginalLead(leadData);
    }
  }, [leadData]);

  // Get update function from Hook
  const updateLead = useUpdateLeadAPI();

  // Handle save
  const handleSave = async () => {
    if (!lead || !originalLead) return;

    setSaving(true);
    try {
      await updateLead(lead.id, {
        full_name: lead.full_name,
        display_name: lead.display_name,
        tel: lead.tel,
        line_id: lead.line_id,
        email: lead.email,
        qr_code: lead.qr_code,
        region: lead.region,
        category: lead.category,
        status: lead.status,
        platform: lead.platform,
        user_id_platform: lead.user_id_platform,
        sale_owner_id: lead.sale_owner_id,
        ad_campaign_id: lead.ad_campaign_id,
        avg_electricity_bill: lead.avg_electricity_bill,
        daytime_percent: lead.daytime_percent,
        notes: lead.notes,
        operation_status: lead.operation_status,
      });

      toast({
        title: "บันทึกสำเร็จ",
        description: "ข้อมูลลูกค้าถูกบันทึกเรียบร้อยแล้ว",
      });

      // Invalidate และ refetch ข้อมูลใหม่
      await queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      await refetchLead();
      
      setOriginalLead(lead);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลลูกค้าได้",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (originalLead) {
      setLead(originalLead);
    }
  };

  // Check if there are unsaved changes
  const hasChanges = lead && originalLead && JSON.stringify(lead) !== JSON.stringify(originalLead);

  if (!isValidId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">ID ไม่ถูกต้อง</h2>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  if (leadLoading || salesTeamLoading || latestLogLoading) {
    return <PageLoading type="form" />;
  }

  if (leadError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mt-2">ไม่สามารถดึงข้อมูลลูกค้าได้</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">ไม่พบข้อมูลลูกค้า</h2>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  {lead.full_name || 'ลูกค้าไม่มีชื่อ'}
                </h1>
                <p className="text-gray-600 text-xs">รหัสลูกค้า: {lead.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  ยกเลิก
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left Column - Contact & Energy Info */}
          <div className="xl:col-span-2 space-y-4">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ข้อมูลติดต่อและแพลตฟอร์ม</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="full_name" className="block text-xs font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุล
                    </Label>
                    <Input
                      id="full_name"
                      value={lead.full_name || ''}
                      onChange={(e) => setLead({ ...lead, full_name: e.target.value })}
                      placeholder="กรอกชื่อ-นามสกุล"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name" className="block text-xs font-medium text-gray-700 mb-1">
                      ชื่อที่แสดง
                    </Label>
                    <Input
                      id="display_name"
                      value={lead.display_name || ''}
                      onChange={(e) => setLead({ ...lead, display_name: e.target.value })}
                      placeholder="กรอกชื่อที่แสดง"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tel" className="block text-xs font-medium text-gray-700 mb-1">
                      เบอร์โทรศัพท์
                    </Label>
                    <Input
                      id="tel"
                      value={lead.tel || ''}
                      onChange={(e) => setLead({ ...lead, tel: e.target.value })}
                      placeholder="กรอกเบอร์โทรศัพท์"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="line_id" className="block text-xs font-medium text-gray-700 mb-1">
                      Line ID
                    </Label>
                    <Input
                      id="line_id"
                      value={lead.line_id || ''}
                      onChange={(e) => setLead({ ...lead, line_id: e.target.value })}
                      placeholder="กรอก Line ID"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                      อีเมล
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={lead.email || ''}
                      onChange={(e) => setLead({ ...lead, email: e.target.value })}
                      placeholder="กรอกอีเมล"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region" className="block text-xs font-medium text-gray-700 mb-1">
                      จังหวัด
                    </Label>
                    <Input
                      id="region"
                      value={lead.region || ''}
                      onChange={(e) => setLead({ ...lead, region: e.target.value })}
                      placeholder="กรอกจังหวัด"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1">
                      ประเภทลูกค้า
                    </Label>
                    <Select
                      value={lead.category || ''}
                      onValueChange={(val) => setLead({ ...lead, category: val })}
                    >
                      <SelectTrigger className="h-8 text-sm" id="category">
                        <SelectValue placeholder="เลือกประเภทลูกค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Package">Package</SelectItem>
                        <SelectItem value="Wholesales">Wholesales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="platform" className="block text-xs font-medium text-gray-700 mb-1">
                      แพลตฟอร์ม
                    </Label>
                    <Select
                      value={lead.platform || ''}
                      onValueChange={(val) => setLead({ ...lead, platform: val })}
                    >
                      <SelectTrigger className="h-8 text-sm" id="platform">
                        <SelectValue placeholder="เลือกแพลตฟอร์ม" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map(platform => (
                          <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user_id_platform" className="block text-xs font-medium text-gray-700 mb-1">
                      รหัสผู้ใช้บนแพลตฟอร์ม
                    </Label>
                    <div className="h-8 p-2 bg-gray-50 rounded-md border text-sm text-gray-900 flex items-center">
                      {lead.user_id_platform || 'ไม่ระบุ'}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ad_campaign_id" className="block text-xs font-medium text-gray-700 mb-1">
                      แหล่งที่มาจากแอด
                    </Label>
                    <AdCampaignSelect
                      value={lead.ad_campaign_id?.toString() || ''}
                      onValueChange={(val) => setLead({ ...lead, ad_campaign_id: val === '' || val === 'none' ? null : parseInt(val) })}
                      placeholder="เลือกแคมเปญโฆษณา (ถ้ามี)"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      แสดงเฉพาะแอดที่กำลัง Active อยู่ (ไม่บังคับ)
                    </p>
                  </div>

                </div>
                
                {/* Notes and QR Code Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">
                      บันทึกเพิ่มเติม
                    </Label>
                    <Textarea
                      id="notes"
                      value={lead.notes || ''}
                      onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                      placeholder="กรอกบันทึกเกี่ยวกับลูกค้ารายนี้..."
                      className="w-full min-h-[80px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                  
                  {/* QR Code Section */}
                  {lead.qr_code && (
                    <div>
                      <Label className="block text-xs font-medium text-gray-700 mb-1">
                        QR Code
                      </Label>
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative group cursor-pointer" onClick={() => setIsQRCodeViewerOpen(true)}>
                          <img
                            src={lead.qr_code}
                            alt="QR Code"
                            className="max-w-32 max-h-32 object-contain rounded border transition-transform hover:scale-105"
                            onError={(e) => {
                              console.error('Failed to load QR code image:', lead.qr_code);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">คลิกเพื่อดูรูปใหญ่</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Energy Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ข้อมูลการใช้พลังงาน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="avg_electricity_bill" className="block text-xs font-medium text-gray-700 mb-1">
                      ค่าไฟเฉลี่ยต่อเดือน (บาท)
                    </Label>
                    <Input
                      id="avg_electricity_bill"
                      value={lead.avg_electricity_bill || ''}
                      onChange={(e) => setLead({ ...lead, avg_electricity_bill: e.target.value })}
                      placeholder="กรอกจำนวนเงิน"
                      type="number"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daytime_percent" className="block text-xs font-medium text-gray-700 mb-1">
                      เปอร์เซ็นต์การใช้ไฟช่วงกลางวัน (%)
                    </Label>
                    <Input
                      id="daytime_percent"
                      value={lead.daytime_percent || ''}
                      onChange={(e) => setLead({ ...lead, daytime_percent: e.target.value })}
                      placeholder="กรอกเปอร์เซ็นต์ (0-100)"
                      type="number"
                      min={0}
                      max={100}
                      className="h-8 text-sm"
                    />
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Platform Info & Status */}
          <div className="space-y-4">
            {/* Latest Lead Log */}
            <LatestLeadLogCard 
              latestLog={latestLog}
              leadId={leadId!}
              leadName={lead.full_name || 'ไม่ระบุชื่อ'}
              leadStatus={lead.status}
              operationStatus={lead.operation_status}
              salesOwnerName={getSalesOwnerName(lead.sale_owner_id)}
              createdAt={lead.created_at_thai}
              updatedAt={lead.updated_at_thai}
            />




          </div>
        </div>
      </div>
      
      {/* QR Code Image Viewer */}
      {lead?.qr_code && (
        <ImageViewer
          isOpen={isQRCodeViewerOpen}
          onClose={() => setIsQRCodeViewerOpen(false)}
          imageSrc={lead.qr_code}
          imageAlt="QR Code"
          title="QR Code สำหรับลูกค้า"
        />
      )}
    </div>
  );
};

export default LeadDetail;
