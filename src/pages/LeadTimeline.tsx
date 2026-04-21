
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, ArrowRightLeft, UserPlus } from "lucide-react";
import LeadSummaryCard from "@/components/timeline/LeadSummaryCard";
import TimelineList from "@/components/timeline/TimelineList";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/useToast";

const LeadTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for transfer dialog
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedSalesOwnerId, setSelectedSalesOwnerId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Convert string id to number and validate
  const leadId = id ? parseInt(id, 10) : null;
  const isValidId = Boolean(leadId && !isNaN(leadId));

  // Fetch lead details with better error handling and caching
  const { data: lead, isLoading: leadLoading, error: leadError } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!isValidId) return null;
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, created_at_thai, updated_at_thai, display_name, sale_owner_id, platform, region, category, avg_electricity_bill, notes, operation_status')
        .eq('id', leadId)
        .single();
      
      if (error) {
        console.error('Error fetching lead:', error);
        throw error;
      }
      
      return data;
    },
    enabled: isValidId,
    staleTime: 1000 * 60 * 10, // cache 10 นาที
    gcTime: 1000 * 60 * 60, // cache 1 ชั่วโมง
    refetchOnWindowFocus: false,
  });

  // Fetch sales team data
  const { data: salesTeam = [], isLoading: salesTeamLoading } = useQuery({
    queryKey: ['sales-team-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_team_with_user_info')
        .select('id, name, email, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // cache 5 นาที
    gcTime: 1000 * 60 * 30, // cache 30 นาที
    refetchOnWindowFocus: false,
  });

  // Fetch timeline data with better caching
  const { data: timeline = [], isLoading: timelineLoading, error: timelineError } = useQuery({
    queryKey: ['lead-timeline', leadId],
    queryFn: async () => {
      if (!isValidId) return [];
      
      const { data, error } = await supabase
        .from('lead_productivity_logs')
        .select(`
          *,
          appointments(*),
          credit_evaluation(*),
          lead_products(*, products(*))
        `)
        .eq('lead_id', leadId)
        .order('created_at_thai', { ascending: false });
      
      if (error) {
        console.error('Error fetching timeline:', error);
        throw error;
      }
      
      // ✅ ดึงข้อมูล quotations และ quotation_documents พร้อมกัน (Parallel Queries)
      if (data && data.length > 0) {
        const logIds = data.map(log => log.id);
        const saleIds = data
          .map(log => log.sale_id)
          .filter((id): id is number => id !== null && id !== undefined);
        
        const [quotationsResult, quotationDocumentsResult, salesTeamResult] = await Promise.all([
          supabase
            .from('quotations')
            .select('*')
            .in('productivity_log_id', logIds),
          supabase
            .from('quotation_documents')
            .select('*')
            .in('productivity_log_id', logIds),
          saleIds.length > 0
            ? supabase
                .from('sales_team_with_user_info')
                .select('id, name')
                .in('id', saleIds)
            : Promise.resolve({ data: [], error: null })
        ]);
        
        // ตรวจสอบ errors
        if (quotationsResult.error) {
          console.error('Error fetching quotations:', quotationsResult.error);
        }
        if (quotationDocumentsResult.error) {
          console.error('Error fetching quotation documents:', quotationDocumentsResult.error);
        }
        if (salesTeamResult.error) {
          console.error('Error fetching sales team:', salesTeamResult.error);
        }
        
        // สร้าง Map สำหรับ lookup ชื่อผู้สร้างจาก sale_id
        const salesMap = new Map(
          (salesTeamResult.data || []).map(sale => [sale.id, sale.name])
        );
        
        // รวมข้อมูล quotations, quotation_documents และ sale information เข้ากับ logs
        const enrichedData = data.map(log => ({
          ...log,
          quotations: quotationsResult.data?.filter(q => q.productivity_log_id === log.id) || [],
          quotation_documents: quotationDocumentsResult.data?.filter(qd => qd.productivity_log_id === log.id) || [],
          sale_name: log.sale_id ? salesMap.get(log.sale_id) || null : null
        }));
        
        return enrichedData;
      }
      
      return data || [];
    },
    enabled: isValidId,
    staleTime: 1000 * 60 * 5, // cache 5 นาที
    gcTime: 1000 * 60 * 30, // cache 30 นาที
    refetchOnWindowFocus: false,
  });


  // Handle lead transfer with sales owner assignment
  const handleTransferLead = async () => {
    if (!lead || !selectedSalesOwnerId || !selectedCategory) return;
    
    const saleOwnerId = selectedSalesOwnerId === "none" ? null : parseInt(selectedSalesOwnerId);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          sale_owner_id: saleOwnerId,
          category: selectedCategory,
        })
        .eq('id', lead.id);

      if (error) throw error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      // Refetch lead data เพื่อให้ได้ข้อมูลล่าสุด
      queryClient.refetchQueries({ queryKey: ['lead', leadId] });
      
      toast({
        title: "สำเร็จ",
        description: saleOwnerId 
          ? `โอนลีดไป ${selectedCategory} และมอบหมายให้ ${salesTeam.find(m => m.id === saleOwnerId)?.name || 'เซลล์ที่เลือก'} เรียบร้อยแล้ว`
          : `โอนลีดไป ${selectedCategory} (กองกลาง) เรียบร้อยแล้ว`,
      });

      // Reset dialog state
      setIsTransferDialogOpen(false);
      setSelectedSalesOwnerId("");
      setSelectedCategory("");
    } catch (error) {
      console.error('Error transferring lead:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโอนลีดได้",
        variant: "destructive",
      });
    }
  };

  // Refetch lead data เมื่อเข้าหน้าเพื่อให้ได้ข้อมูลล่าสุด
  useEffect(() => {
    if (leadId) {
      queryClient.refetchQueries({ queryKey: ['lead', leadId] });
    }
  }, [leadId, queryClient]);

  // Handle invalid ID
  if (!isValidId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">ID ไม่ถูกต้อง</h2>
        <Button onClick={() => navigate('/my-leads')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  if (leadLoading || timelineLoading || salesTeamLoading) {
    return <PageLoading type="form" />;
  }

  // Handle errors
  if (leadError || timelineError) {
    console.error('Lead or timeline error:', leadError || timelineError);
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
        <p className="text-gray-600 mt-2">กรุณาลองใหม่อีกครั้ง</p>
        <Button onClick={() => navigate('/my-leads')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">ไม่พบข้อมูลลีด</h2>
        <p className="text-gray-600 mt-2">อาจจะเป็นเพราะคุณไม่มีสิทธิ์เข้าถึงลีดนี้ หรือลีดนี้ถูกลบแล้ว</p>
        <Button onClick={() => navigate('/my-leads')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">


      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/my-leads')}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              การติดตาม - {lead.full_name || 'ไม่ระบุชื่อ'}
            </h1>
            <p className="text-gray-600 mb-1">ประวัติการติดตามลีด</p>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('th-TH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {lead?.sale_owner_id && (
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  โอนลีด
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>โอนลีดและมอบหมายให้เซลล์</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      โอนจาก <span className="font-semibold text-orange-600">{lead.category}</span> ไป
                    </Label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200">
                        <SelectValue placeholder="เลือกประเภทการขายปลายทาง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem 
                          value="Package"
                          className="hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 py-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="font-semibold text-blue-600">Package</span>
                            <span className="text-xs text-gray-500 ml-auto">ขายแพ็กเกจ</span>
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="Wholesales"
                          className="hover:bg-green-50 focus:bg-green-50 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 py-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-semibold text-green-600">Wholesales</span>
                            <span className="text-xs text-gray-500 ml-auto">ขายส่ง</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sales-owner-select" className="text-sm font-medium">
                      มอบหมายให้เซลล์
                    </Label>
                    <Select 
                      value={selectedSalesOwnerId} 
                      onValueChange={setSelectedSalesOwnerId}
                    >
                      <SelectTrigger 
                        id="sales-owner-select"
                        className="h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <SelectValue placeholder="เลือกเซลล์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem 
                          value="none"
                          className="hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 py-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <span className="text-gray-600 font-medium">ไม่มอบหมาย (กองกลาง)</span>
                          </div>
                        </SelectItem>
                        {salesTeam.map(member => (
                          <SelectItem 
                            key={member.id} 
                            value={member.id.toString()}
                            className="hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-200 cursor-pointer"
                          >
                            <div className="flex items-center space-x-3 py-2">
                              <UserPlus className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-gray-900">{member.name}</span>
                              <span className="text-xs text-gray-500 ml-auto">เซลล์</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      เลือก "ไม่มอบหมาย" เพื่อโอนลีดไปกองกลาง หรือเลือกเซลล์เพื่อมอบหมายให้
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsTransferDialogOpen(false);
                        setSelectedSalesOwnerId("");
                        setSelectedCategory("");
                      }}
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      onClick={handleTransferLead}
                      disabled={!selectedSalesOwnerId || !selectedCategory}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      โอนลีด
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            onClick={() => navigate(`/productivity-log/add/${leadId}`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            ฟอร์มติดตามลูกค้า
          </Button>
        </div>
      </div>

      {/* Lead Summary */}
      <LeadSummaryCard lead={lead} />

      {/* Timeline */}
      <TimelineList 
        timeline={timeline} 
        onAddLog={() => navigate(`/productivity-log/add/${leadId}`)}
        leadId={leadId || undefined}
        isWholesale={lead?.category === 'Wholesale' || lead?.category === 'Wholesales'}
        isPackage={lead?.category === 'Package'}
      />
    </div>
  );
};

export default LeadTimeline;
