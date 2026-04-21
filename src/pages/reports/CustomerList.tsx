import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { Users, Calendar, Filter, FileText, Download, Megaphone, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";
import { getCategoryBadgeClassName } from "@/utils/categoryBadgeUtils";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";
import Pagination from "@/components/ui/pagination";
import * as XLSX from 'xlsx';

interface CustomerListData {
  customers: any[];
}

const CustomerList = () => {
  // Get all sales team data..
  const { data: salesTeamData, isLoading: salesTeamLoading } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};
  
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [electricityBillFilter, setElectricityBillFilter] = useState<string>('all');
  const [presentationFilter, setPresentationFilter] = useState<string>('all');
  const [saleChanceFilter, setSaleChanceFilter] = useState<string>('all');
  const [dashboardData, setDashboardData] = useState<CustomerListData>({
    customers: []
  });
  const [allCustomers, setAllCustomers] = useState<any[]>([]); // เก็บข้อมูลทั้งหมดก่อนกรอง
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRangeFilter, salesFilter, categoryFilter, statusFilter]);

  // กรองข้อมูลใน frontend สำหรับ filter ที่ซับซ้อน
  useEffect(() => {
    if (allCustomers.length === 0) {
      setDashboardData({ customers: [] });
      return;
    }

    let filtered = [...allCustomers];

    // หมายเหตุ: category และ status ถูกกรองใน query แล้ว (backend)
    // กรองเฉพาะ filter ที่ต้องทำใน frontend

    // กรองตามค่าไฟ
    if (electricityBillFilter !== 'all') {
      filtered = filtered.filter(customer => {
        const bill = customer.avg_electricity_bill || 0;
        if (electricityBillFilter === '0-3000') {
          return bill >= 0 && bill <= 3000;
        } else if (electricityBillFilter === '3000-8000') {
          return bill > 3000 && bill <= 8000;
        } else if (electricityBillFilter === 'more-than-8000') {
          return bill > 8000;
        }
        return true;
      });
    }

    // กรองตามการนำเสนอ (presentation_type)
    if (presentationFilter !== 'all') {
      filtered = filtered.filter(customer => {
        return customer.presentation_type === presentationFilter;
      });
    }

    // กรองตามโอกาสการขาย
    if (saleChanceFilter !== 'all') {
      filtered = filtered.filter(customer => {
        return customer.sale_chance_status === saleChanceFilter;
      });
    }

    // เรียงลำดับตามวันที่ (ใหม่ไปเก่า - descending)
    filtered.sort((a, b) => {
      const dateA = a.created_at_thai ? new Date(a.created_at_thai).getTime() : 0;
      const dateB = b.created_at_thai ? new Date(b.created_at_thai).getTime() : 0;
      return dateB - dateA; // ใหม่ไปเก่า
    });

    setDashboardData({ customers: filtered });
    setCurrentPage(1); // Reset to first page when filters change
  }, [allCustomers, electricityBillFilter, presentationFilter, saleChanceFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use proper timezone handling for date range
      let startDate: string, endDate: string;
      
      if (dateRangeFilter?.from && dateRangeFilter?.to) {
        const fromDate = new Date(dateRangeFilter.from);
        const toDate = new Date(dateRangeFilter.to);
        
        // Format dates for Thai timezone
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Format start date - Start from 00:00:00 Thai time
        const startDateString = formatter.format(fromDate);
        startDate = startDateString + 'T00:00:00.000';
        
        // Format end date - End at 23:59:59 Thai time
        const endDateString = formatter.format(toDate);
        endDate = endDateString + 'T23:59:59.999';
      } else {
        // No date range selected - show all data (no date filter)
        startDate = '';
        endDate = '';
      }

      const salesFilterParam = salesFilter !== 'all' ? salesFilter : undefined;
      
      // ✅ แก้ไข: ดึง productivity logs ก่อน (ใช้ created_at_thai ของ log สำหรับ date filter)
      let logsQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id, lead_id, sale_id, created_at_thai, sale_chance_status, sale_chance_percent,
          lead_group, presentation_type, note, next_follow_up, next_follow_up_details,
          leads!inner(
            id, full_name, display_name, status, platform, category, tel, line_id,
            sale_owner_id, post_sales_owner_id, avg_electricity_bill, ad_campaign_id,
            created_at_thai, updated_at_thai,
            ads_campaigns (id, name, campaign_name, image_url)
          )
        `);

      // ✅ แก้ไข: ถ้า filter status = "รอรับ" ต้องมี sale_owner_id = NULL
      // แต่ถ้า filter status อื่นๆ ต้องมี sale_owner_id (ไม่เป็น null)
      if (statusFilter === 'รอรับ') {
        logsQuery = logsQuery.is('leads.sale_owner_id', null);
      } else {
        logsQuery = logsQuery.not('leads.sale_owner_id', 'is', null);
      }

      // Apply date filter (ใช้ created_at_thai ของ log)
      if (startDate && endDate && startDate !== '' && endDate !== '') {
        logsQuery = logsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      // Apply sales filter
      // ✅ แก้ไข: ใช้วิธีแยก query เพื่อหลีกเลี่ยงปัญหา nested relationship ใน .or()
      if (salesFilterParam) {
        const salesFilterId = parseInt(salesFilterParam, 10);
        if (isNaN(salesFilterId)) {
          console.error('Invalid sales filter ID:', salesFilterParam);
        } else {
          // ดึง lead_ids ที่ตรงกับ sales filter จากตาราง leads
          const { data: matchingLeads } = await supabase
            .from('leads')
            .select('id')
            .or(`sale_owner_id.eq.${salesFilterId},post_sales_owner_id.eq.${salesFilterId}`);
          
          const matchingLeadIds: number[] = matchingLeads ? matchingLeads.map(lead => lead.id) : [];
          
          // กรอง logs โดยใช้ sale_id หรือ lead_id ที่อยู่ในรายการ matchingLeadIds
          if (matchingLeadIds.length > 0) {
            // ใช้ .or() โดยแยกเป็น sale_id หรือ lead_id.in()
            logsQuery = logsQuery.or(
              `sale_id.eq.${salesFilterId},lead_id.in.(${matchingLeadIds.join(',')})`
            );
          } else {
            // ถ้าไม่มี matching leads ให้กรองแค่ sale_id
            logsQuery = logsQuery.eq('sale_id', salesFilterId);
          }
        }
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        logsQuery = logsQuery.eq('leads.category', categoryFilter);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        logsQuery = logsQuery.eq('leads.status', statusFilter);
      }

      const { data: logsData, error: logsError } = await logsQuery;

      if (logsError) {
        console.error('Error fetching logs data:', logsError);
        setDashboardData({ customers: [] });
        return;
      }

      if (!logsData || logsData.length === 0) {
        setDashboardData({ customers: [] });
        return;
      }

      // ดึง unique lead IDs จาก logs ที่ได้มา
      const uniqueLeadIdsFromLogs = [...new Set(logsData?.map(log => log.lead_id) || [])];

      // ดึงข้อมูล leads ทั้งหมดที่เกี่ยวข้อง (แบ่งเป็น chunks เพื่อหลีกเลี่ยง URL ยาวเกินไป)
      let leadsData: any[] = [];
      
      if (uniqueLeadIdsFromLogs.length > 0) {
        // ✅ ลด CHUNK_SIZE จาก 500 เป็น 200 เพื่อหลีกเลี่ยง URL ยาวเกินไป
        const CHUNK_SIZE = 200;
        const leadChunks: number[][] = [];
        for (let i = 0; i < uniqueLeadIdsFromLogs.length; i += CHUNK_SIZE) {
          leadChunks.push(uniqueLeadIdsFromLogs.slice(i, i + CHUNK_SIZE));
        }

        // ✅ Query แบบ sequential เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไปและ rate limiting
        for (const chunk of leadChunks) {
          try {
            let leadsQuery = supabase
              .from('leads')
              .select(`
                id, full_name, display_name, status, platform, category, tel, line_id,
                sale_owner_id, post_sales_owner_id, avg_electricity_bill, ad_campaign_id,
                created_at_thai, updated_at_thai,
                ads_campaigns (id, name, campaign_name, image_url)
              `)
              .in('id', chunk);

            // ✅ แก้ไข: ถ้า filter status = "รอรับ" ต้องมี sale_owner_id = NULL
            // แต่ถ้า filter status อื่นๆ ต้องมี sale_owner_id (ไม่เป็น null)
            if (statusFilter === 'รอรับ') {
              leadsQuery = leadsQuery.is('sale_owner_id', null);
            } else if (statusFilter !== 'all') {
              leadsQuery = leadsQuery.not('sale_owner_id', 'is', null);
            }

            // Apply sales, category, status filters to leadsQuery
            if (salesFilterParam) {
              // ถ้า filter status = "รอรับ" และมี salesFilterParam จะไม่มีผล (เพราะ sale_owner_id = NULL)
              if (statusFilter !== 'รอรับ') {
                leadsQuery = leadsQuery.or(
                  `sale_owner_id.eq.${salesFilterParam},post_sales_owner_id.eq.${salesFilterParam}`
                );
              }
            }
            if (categoryFilter !== 'all') {
              leadsQuery = leadsQuery.eq('category', categoryFilter);
            }
            if (statusFilter !== 'all') {
              leadsQuery = leadsQuery.eq('status', statusFilter);
            }

            const { data, error } = await leadsQuery;

            if (error) {
              console.error(`Error fetching leads for chunk:`, error);
              // Continue with next chunk instead of failing completely
            } else if (data) {
              leadsData = [...leadsData, ...data];
            }
          } catch (error) {
            console.error(`Error processing leads chunk:`, error);
            // Continue with next chunk
          }
        }
      }

      if (leadsData.length === 0) {
        setDashboardData({
          customers: []
        });
        return;
      }

      // ดึงข้อมูล productivity logs ที่มี QT (ใช้ logsData ที่ได้มาแล้ว)
      const logIds = logsData.map(log => log.id);
      let logsWithQt: any[] = [];
      let quotationDocumentsMap = new Map();
      
      if (logIds.length > 0) {
        // แบ่ง logIds เป็น chunks สำหรับ quotation documents query
        // ✅ ลด CHUNK_SIZE จาก 500 เป็น 200 เพื่อหลีกเลี่ยง URL ยาวเกินไป
        const CHUNK_SIZE = 200;
        const logChunks: number[][] = [];
        for (let i = 0; i < logIds.length; i += CHUNK_SIZE) {
          logChunks.push(logIds.slice(i, i + CHUNK_SIZE));
        }

        // ✅ Query quotation documents แบบ sequential เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
        let allQuotations: any[] = [];
        for (const chunk of logChunks) {
          try {
            const { data, error } = await supabase
              .from('quotation_documents')
              .select('productivity_log_id, document_number, amount, created_at_thai')
              .in('productivity_log_id', chunk)
              .eq('document_type', 'quotation');

            if (error) {
              console.error(`Error fetching quotations for chunk:`, error);
              // Continue with next chunk instead of failing completely
            } else if (data) {
              allQuotations = [...allQuotations, ...data];
            }
          } catch (error) {
            console.error(`Error processing quotations chunk:`, error);
            // Continue with next chunk
          }
        }

        if (allQuotations.length > 0) {
          // จัดกลุ่ม QT ตาม log_id
          allQuotations.forEach(qt => {
            if (!quotationDocumentsMap.has(qt.productivity_log_id)) {
              quotationDocumentsMap.set(qt.productivity_log_id, []);
            }
            quotationDocumentsMap.get(qt.productivity_log_id).push({
              document_number: qt.document_number,
              amount: qt.amount?.toString() || '0',
              created_at_thai: qt.created_at_thai,
              productivity_log_id: qt.productivity_log_id
            });
          });

          // เก็บเฉพาะ logs ที่มี QT
          logsWithQt = logsData.filter(log => quotationDocumentsMap.has(log.id));
        }
      }

      // สร้าง map ของ logs สำหรับ lookup (ใช้ logsData ที่ได้มาแล้ว)
      let latestLogsMap = new Map();
      logsData.forEach(log => {
        if (!latestLogsMap.has(log.lead_id)) {
          latestLogsMap.set(log.lead_id, log);
        } else {
          // ถ้ามี log หลายตัว ให้ใช้ตัวที่ใหม่ที่สุด
          const existingLog = latestLogsMap.get(log.lead_id);
          if (new Date(log.created_at_thai) > new Date(existingLog.created_at_thai)) {
            latestLogsMap.set(log.lead_id, log);
          }
        }
      });

      // สร้าง customers array
      const customers: any[] = [];

      // ✅ Validate: ถ้า filter status = "รอรับ" ต้องไม่มี sale_owner_id
      // กรองข้อมูลที่ไม่สอดคล้องกันออก (มี sale_owner_id แต่ status = "รอรับ")
      const validLeadsData = leadsData.filter(lead => {
        if (statusFilter === 'รอรับ') {
          // ถ้า filter "รอรับ" แต่มี sale_owner_id ให้กรองออก
          return lead.sale_owner_id === null || lead.sale_owner_id === undefined;
        }
        return true;
      });

      // สำหรับ leads ที่มี QT → แสดงแยกตาม log ที่มี QT
      const leadsWithQt = new Set(logsWithQt.map(log => log.lead_id));
      
      logsWithQt.forEach(log => {
        const lead = validLeadsData.find(l => l.id === log.lead_id);
        if (!lead) return;

        const adCampaignName = lead.ads_campaigns?.name || lead.ads_campaigns?.campaign_name || null;
        const adCampaignImageUrl = lead.ads_campaigns?.image_url || null;
        const quotationDocuments = quotationDocumentsMap.get(log.id) || [];
        const totalQuotationAmount = quotationDocuments.reduce((sum: number, doc: any) => 
          sum + (parseFloat(doc.amount || '0') || 0), 0);
        
        // ดึงข้อมูล log สำหรับ QT นี้
        const logData = latestLogsMap.get(lead.id);
        
        customers.push({
          id: `${log.id}-${lead.id}`, // ใช้ composite key เพื่อให้ unique
          logId: log.id,
          leadId: lead.id,
          display_name: lead.display_name || lead.full_name,
          full_name: lead.full_name,
          category: lead.category || 'ไม่ระบุ',
          platform: lead.platform || 'ไม่ระบุ',
          tel: lead.tel || 'ไม่ระบุ',
          line_id: lead.line_id || 'ไม่ระบุ',
          sale_owner_id: lead.sale_owner_id || 0,
          sale_id: log.sale_id || lead.sale_owner_id || 0,
          status: lead.status || 'ไม่ระบุ',
          created_at_thai: log.created_at_thai, // ใช้ created_at_thai ของ log ที่มี QT
          totalQuotationAmount: totalQuotationAmount,
          totalQuotationCount: quotationDocuments.length,
          quotationNumbers: quotationDocuments.map((doc: any) => doc.document_number),
          quotationDocuments: quotationDocuments,
          avg_electricity_bill: lead.avg_electricity_bill || 0,
          ad_campaign_name: adCampaignName,
          ad_campaign_image_url: adCampaignImageUrl,
          sale_chance_status: logData?.sale_chance_status || 'ไม่ระบุ',
          sale_chance_percent: logData?.sale_chance_percent || 0,
          lead_group: logData?.lead_group || 'ไม่ระบุ',
          presentation_type: logData?.presentation_type || 'ไม่ระบุ',
          latest_log: {
            id: log.id,
            note: logData?.note || 'ไม่มีรายละเอียดการติดตาม',
            next_follow_up: logData?.next_follow_up,
            next_follow_up_details: logData?.next_follow_up_details,
            created_at_thai: log.created_at_thai
          }
        });
      });

      // สำหรับ leads ที่ไม่มี QT → แสดง 1 แถว (ใช้ log ล่าสุด)
      validLeadsData.forEach(lead => {
        if (!leadsWithQt.has(lead.id)) {
          const adCampaignName = lead.ads_campaigns?.name || lead.ads_campaigns?.campaign_name || null;
          const adCampaignImageUrl = lead.ads_campaigns?.image_url || null;
          const logData = latestLogsMap.get(lead.id);
          
          customers.push({
            id: `${lead.id}-${logData?.id || 'no-log'}`, // ใช้ composite key เพื่อให้ unique
            logId: logData?.id || null,
            leadId: lead.id,
            display_name: lead.display_name || lead.full_name,
            full_name: lead.full_name,
            category: lead.category || 'ไม่ระบุ',
            platform: lead.platform || 'ไม่ระบุ',
            tel: lead.tel || 'ไม่ระบุ',
            line_id: lead.line_id || 'ไม่ระบุ',
            sale_owner_id: lead.sale_owner_id || 0,
            sale_id: logData?.sale_id || lead.sale_owner_id || 0,
            status: lead.status || 'ไม่ระบุ',
            created_at_thai: logData?.created_at_thai || lead.updated_at_thai || lead.created_at_thai,
            totalQuotationAmount: 0,
            totalQuotationCount: 0,
            quotationNumbers: [],
            quotationDocuments: [],
            avg_electricity_bill: lead.avg_electricity_bill || 0,
            ad_campaign_name: adCampaignName,
            ad_campaign_image_url: adCampaignImageUrl,
            sale_chance_status: logData?.sale_chance_status || 'ไม่ระบุ',
            sale_chance_percent: logData?.sale_chance_percent || 0,
            lead_group: logData?.lead_group || 'ไม่ระบุ',
            presentation_type: logData?.presentation_type || 'ไม่ระบุ',
            latest_log: {
              id: logData?.id || lead.id,
              note: logData?.note || 'ไม่มีรายละเอียดการติดตาม',
              next_follow_up: logData?.next_follow_up,
              next_follow_up_details: logData?.next_follow_up_details,
              created_at_thai: logData?.created_at_thai || lead.updated_at_thai || lead.created_at_thai
            }
          });
        }
      });

      // เก็บข้อมูลทั้งหมดไว้ใน allCustomers สำหรับการกรองใน frontend
      setAllCustomers(customers || []);

    } catch (error) {
      console.error('Error fetching customer list data:', error);
      setDashboardData({
        customers: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'ไม่ระบุ';
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: string } } = {
      'มากกว่า 50%': { label: 'มากกว่า 50%', variant: 'default' },
      '50:50': { label: '50:50', variant: 'secondary' },
      'น้อยกว่า 50%': { label: 'น้อยกว่า 50%', variant: 'outline' },
      'win': { label: 'win', variant: 'default' },
      'win + สินเชื่อ': { label: 'win + สินเชื่อ', variant: 'default' },
      'มัดจำเงิน': { label: 'มัดจำเงิน', variant: 'secondary' },
      'CXL': { label: 'CXL', variant: 'destructive' },
      'ไม่ระบุ': { label: 'ไม่ระบุ', variant: 'outline' }
    };
    
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  const getPresentationType = (lead: any) => {
    // ใช้ข้อมูลจาก lead_group และ presentation_type
    if (lead.lead_group && lead.presentation_type) {
      return `${lead.lead_group} - ${lead.presentation_type}`;
    } else if (lead.lead_group) {
      return lead.lead_group;
    } else if (lead.presentation_type) {
      return lead.presentation_type;
    }
    return 'ไม่ระบุ';
  };

  const getLatestFollowUpLog = (lead: any) => {
    if (!lead.latest_log) return 'ไม่มีข้อมูล';
    
    const log = lead.latest_log;
    const dateStr = log.created_at_thai;
    let formattedDate = '';
    
    if (dateStr) {
      // แปลงจาก 2025-09-17T11:34:08.370852+00:00 เป็น 17/09/2025 , 11:34
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        formattedDate = `${day}/${month}/${year} , ${hours}:${minutes}`;
      } else {
        formattedDate = dateStr;
      }
    } else {
      formattedDate = 'ไม่ระบุวันที่';
    }
    
    return {
      date: formattedDate,
      note: log.note || 'ไม่มีรายละเอียด',
      nextFollowUp: log.next_follow_up,
      nextFollowUpDetails: log.next_follow_up_details
    };
  };

  const exportToExcel = () => {
    if (!dashboardData.customers || dashboardData.customers.length === 0) {
      alert('ไม่มีข้อมูลให้ export');
      return;
    }

    // เตรียมข้อมูลสำหรับ Excel
    const excelData = dashboardData.customers.map((customer, index) => {
      const saleId = customer.sale_id || customer.sale_owner_id || 0;
      const salesMember = salesTeam.find(member => member.id === saleId);
      const salesMemberName = salesMember?.name || 'ไม่ระบุ';
      
      // รวบรวมข้อมูล QT
      const qtInfo = customer.quotationDocuments && customer.quotationDocuments.length > 0 
        ? customer.quotationDocuments.map(doc => `${doc.document_number} (฿${parseFloat(doc.amount || 0).toLocaleString()})`).join(', ')
        : 'ไม่มี QT';
      
      const qtAmount = customer.totalQuotationAmount || 0;
      const qtCount = customer.totalQuotationCount || 0;
      
      // รวบรวมข้อมูลการติดตาม
      const followUpData = getLatestFollowUpLog(customer);
      const followUpInfo = typeof followUpData === 'string' 
        ? followUpData 
        : `${followUpData.date}: ${followUpData.note}`;

      return {
        'ลำดับ': index + 1,
        'วันที่': new Date(customer.created_at_thai).toLocaleDateString('th-TH'),
        'รายชื่อเซลล์': salesMemberName,
        'Platform': customer.platform,
        'แหล่งที่มาจากแอด': customer.ad_campaign_name || '-',
        'ชื่อลูกค้า': customer.display_name,
        'ชื่อเต็ม': customer.full_name,
        'สถานะ': customer.status,
        'QT / ยอด QT': qtInfo,
        'จำนวน QT': qtCount,
        'ยอด QT รวม': qtAmount,
        'ค่าไฟ': customer.avg_electricity_bill || 0,
        'กลุ่มลูกค้า': customer.category,
        'การนำเสนอ': getPresentationType(customer),
        'โอกาสการขาย': customer.sale_chance_status || 'ไม่ระบุ',
        'รายละเอียดติดตาม': followUpInfo,
        'เบอร์โทร': customer.tel,
        'Line ID': customer.line_id
      };
    });

    // สร้าง workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // กำหนดความกว้างของคอลัมน์
    const colWidths = [
      { wch: 8 },   // ลำดับ
      { wch: 12 },  // วันที่
      { wch: 15 },  // รายชื่อเซลล์
      { wch: 12 },  // Platform
      { wch: 25 },  // แหล่งที่มาจากแอด
      { wch: 20 },  // ชื่อลูกค้า
      { wch: 25 },  // ชื่อเต็ม
      { wch: 15 },  // สถานะ
      { wch: 30 },  // QT / ยอด QT
      { wch: 12 },  // จำนวน QT
      { wch: 15 },  // ยอด QT รวม
      { wch: 12 },  // ค่าไฟ
      { wch: 15 },  // กลุ่มลูกค้า
      { wch: 20 },  // การนำเสนอ
      { wch: 15 },  // โอกาสการขาย
      { wch: 40 },  // รายละเอียดติดตาม
      { wch: 15 },  // เบอร์โทร
      { wch: 15 }   // Line ID
    ];
    ws['!cols'] = colWidths;

    // เพิ่ม worksheet
    XLSX.utils.book_append_sheet(wb, ws, 'รายการลูกค้า');

    // สร้างชื่อไฟล์
    const currentDate = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
    const fileName = `รายการลูกค้า_${currentDate}.xlsx`;

    // Export ไฟล์
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายการลูกค้า</h1>
            <p className="text-gray-600 mt-1">รายการลูกค้าทั้งหมดทุกสถานะ</p>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Filter className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
                <p className="text-xs text-gray-600">เลือกเงื่อนไขเพื่อดูข้อมูลที่ต้องการ</p>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>ช่วงวันที่</span>
              </label>
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="เลือกช่วงวันที่"
              />
            </div>

            {/* Sales Team Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Users className="h-3.5 w-3.5 text-green-500" />
                <span>เซลทีม</span>
              </label>
              <TeamFilterSelect
                value={salesFilter}
                onValueChange={setSalesFilter}
                salesTeam={salesTeam}
                placeholder="เลือกเซลทีม"
                triggerClassName="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span>กลุ่มลูกค้า</span>
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือกกลุ่มลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกกลุ่มลูกค้า</SelectItem>
                  <SelectItem value="Package">Package</SelectItem>
                  <SelectItem value="Wholesales">Wholesales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Filter className="h-3.5 w-3.5 text-purple-500" />
                <span>สถานะ</span>
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="รอรับ">รอรับ</SelectItem>
                  <SelectItem value="กำลังติดตาม">กำลังติดตาม</SelectItem>
                  <SelectItem value="ปิดการขาย">ปิดการขาย</SelectItem>
                  <SelectItem value="ยังปิดการขายไม่สำเร็จ">ยังปิดการขายไม่สำเร็จ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Electricity Bill Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                <span>ค่าไฟ</span>
              </label>
              <Select value={electricityBillFilter} onValueChange={setElectricityBillFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือกค่าไฟ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกค่าไฟ</SelectItem>
                  <SelectItem value="0-3000">0 - 3,000</SelectItem>
                  <SelectItem value="3000-8000">3,000 - 8,000</SelectItem>
                  <SelectItem value="more-than-8000">มากกว่า 8,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Presentation Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                <span>การนำเสนอ</span>
              </label>
              <Select value={presentationFilter} onValueChange={setPresentationFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือกการนำเสนอ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกการนำเสนอ</SelectItem>
                  <SelectItem value="การนำเสนอเก่า">การนำเสนอเก่า</SelectItem>
                  <SelectItem value="การนำเสนอใหม่">การนำเสนอใหม่</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sale Chance Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span>โอกาสการขาย</span>
              </label>
              <Select value={saleChanceFilter} onValueChange={setSaleChanceFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือกโอกาสการขาย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโอกาสการขาย</SelectItem>
                  <SelectItem value="win">win</SelectItem>
                  <SelectItem value="win + สินเชื่อ">win + สินเชื่อ</SelectItem>
                  <SelectItem value="มากกว่า 50%">มากกว่า 50%</SelectItem>
                  <SelectItem value="50:50">50:50</SelectItem>
                  <SelectItem value="น้อยกว่า 50%">น้อยกว่า 50%</SelectItem>
                  <SelectItem value="มัดจำเงิน">มัดจำเงิน</SelectItem>
                  <SelectItem value="CXL">CXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold">รายการลูกค้า</span>
                <p className="text-sm font-normal text-gray-600 mt-1">
                  ข้อมูลลูกค้าทั้งหมด ({dashboardData.customers.length} ลูกค้า)
                </p>
              </div>
            </CardTitle>
            <Button 
              onClick={exportToExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!dashboardData.customers || dashboardData.customers.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-center">วันที่</TableHead>
                  <TableHead className="font-semibold text-center">รายชื่อเซลล์</TableHead>
                  <TableHead className="font-semibold text-center">Platforms</TableHead>
                  <TableHead className="font-semibold text-center">แหล่งที่มาจากแอด</TableHead>
                  <TableHead className="font-semibold text-center">ชื่อลูกค้า</TableHead>
                  <TableHead className="font-semibold text-center">สถานะ</TableHead>
                  <TableHead className="font-semibold text-center">กลุ่มลูกค้า</TableHead>
                  <TableHead className="font-semibold text-center">QT / ยอด QT</TableHead>
                  <TableHead className="font-semibold text-center">ค่าไฟ</TableHead>
                  <TableHead className="font-semibold text-center">การนำเสนอ</TableHead>
                  <TableHead className="font-semibold text-center">โอกาสการขาย</TableHead>
                  <TableHead className="font-semibold text-center">รายละเอียดติดตาม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.customers
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((customer) => {
                  const saleId = customer.sale_id || customer.sale_owner_id || 0;
                  const salesMember = salesTeam.find(member => member.id === saleId);
                  const salesMemberName = salesMember?.name || 'ไม่ระบุ';
                  const statusInfo = getStatusInfo(customer.sale_chance_status);

                  return (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-sm">
                        {formatDate(customer.created_at_thai)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>{salesMemberName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="text-xs">
                          {customer.platform || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {customer.ad_campaign_name ? (
                          <div className="flex items-center justify-center gap-3">
                            {customer.ad_campaign_image_url ? (
                              <img
                                src={customer.ad_campaign_image_url}
                                alt={customer.ad_campaign_name}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 shadow-md flex-shrink-0"
                                onError={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const img = e.target as HTMLImageElement;
                                  if (img.src.includes('fbcdn.net') || img.src.includes('facebook.com')) {
                                    // Silent error - ไม่ log เพราะเป็นเรื่องปกติที่ Facebook CDN URLs หมดอายุ
                                  }
                                  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo img%3C/text%3E%3C/svg%3E";
                                  img.onerror = null;
                                }}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200 flex-shrink-0 shadow-md">
                                <Megaphone className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {customer.ad_campaign_name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div>
                          <div className="font-medium">{customer.display_name}</div>
                          <div className="text-xs text-gray-500">{customer.full_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="text-xs">
                          {customer.status || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className={getCategoryBadgeClassName(customer.category)}>
                          {customer.category || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="space-y-1">
                          {customer.quotationDocuments && customer.quotationDocuments.length > 0 ? (
                            customer.quotationDocuments.map((doc: any, index: number) => (
                              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-1 last:pb-0">
                                <div className="text-xs text-blue-600 font-medium">
                                  {doc.document_number}
                                </div>
                                <div className="text-sm font-semibold text-green-600">
                                  ฿{parseFloat(doc.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400 italic">ไม่มี QT</div>
                          )}
                          {customer.quotationDocuments && customer.quotationDocuments.length > 1 && (
                            <div className="text-xs text-gray-500 font-medium border-t border-gray-200 pt-1 mt-1">
                              รวม: ฿{customer.totalQuotationAmount?.toLocaleString() || '0'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="font-semibold text-green-600">
                          ฿{customer.avg_electricity_bill?.toLocaleString() || '0'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="secondary" className="text-xs">
                          {getPresentationType(customer)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge 
                          variant={statusInfo.variant as any}
                          className="text-xs"
                        >
                          {customer.sale_chance_status || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="max-w-xs">
                          {(() => {
                            const followUpData = getLatestFollowUpLog(customer);
                            if (typeof followUpData === 'string') {
                              return <div className="text-xs text-gray-400 italic">{followUpData}</div>;
                            }
                            return (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500">
                                  {followUpData.date}
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                  {followUpData.note.length > 80 
                                    ? `${followUpData.note.substring(0, 80)}...` 
                                    : followUpData.note
                                  }
                                </div>
                                {followUpData.nextFollowUp && (
                                  <div className="text-xs text-blue-600">
                                    นัดถัดไป: {new Date(followUpData.nextFollowUp).toLocaleDateString('th-TH')}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {dashboardData.customers.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(dashboardData.customers.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={dashboardData.customers.length}
                  showItemsPerPage={false}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerList;

