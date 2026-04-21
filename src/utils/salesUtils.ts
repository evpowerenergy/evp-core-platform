import { supabase } from "@/integrations/supabase/client";

/**
 * ฟังก์ชันสำหรับดึงข้อมูลยอดขายที่ถูกต้อง
 * แก้ไขปัญหายอดขายหายไปจากลีดที่ซื้อซ้ำ
 * เพิ่มเงื่อนไข sale_chance_status เป็น 'win' หรือ 'win + สินเชื่อ' เพื่อความแม่นยำ
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param salesFilter filter ตาม sales member (optional)
 * @param platformFilter filter ตาม platform (optional)
 * @param categoryFilter filter ตาม category (optional)
 * @returns ข้อมูลยอดขายที่ถูกต้อง
 */
export const getSalesDataInPeriod = async (
  startDate: string, 
  endDate: string, 
  salesFilter?: string,
  platformFilter?: string,
  categoryFilter?: string
) => {
  try {
    // ดึง productivity logs ที่มี status 'ปิดการขายแล้ว' และ sale_chance_status เป็น 'win' หรือ 'win + สินเชื่อ' ในช่วงเวลานั้น
    let salesLogsQuery = supabase
      .from('lead_productivity_logs')
      .select(`
        id, 
        lead_id, 
        sale_id,
        created_at_thai,
        leads!inner(
          id,
          sale_owner_id,
          category,
          platform,
          full_name,
          display_name,
          tel,
          line_id,
          is_from_ppa_project
        )
      `)
      .eq('status', 'ปิดการขายแล้ว')
      .or(`sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)`);

    // Only apply date filter if dates are provided
    if (startDate && endDate) {
      salesLogsQuery = salesLogsQuery
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);
    }

    // Apply sales filter
    if (salesFilter && salesFilter !== 'all') {
      salesLogsQuery = salesLogsQuery.eq('sale_id', parseInt(salesFilter));
    }

    // Apply platform filter
    if (platformFilter && platformFilter !== 'all') {
      salesLogsQuery = salesLogsQuery.eq('leads.platform', platformFilter);
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      salesLogsQuery = salesLogsQuery.eq('leads.category', categoryFilter);
    }

    const { data: salesLogs, error: salesLogsError } = await salesLogsQuery;

    if (salesLogsError) {
      console.error('Error fetching sales logs:', salesLogsError);
      throw salesLogsError;
    }

    // Debug: Log sales logs to check if is_from_ppa_project is included
    if (salesLogs && salesLogs.length > 0) {
      const sampleLog = salesLogs[0];
      console.log('📊 getSalesDataInPeriod Debug:', {
        totalSalesLogs: salesLogs.length,
        sampleLog: {
          id: sampleLog.id,
          lead_id: sampleLog.lead_id,
          hasLeads: !!sampleLog.leads,
          leadFields: sampleLog.leads ? Object.keys(sampleLog.leads) : [],
          hasPpaField: sampleLog.leads ? 'is_from_ppa_project' in sampleLog.leads : false,
          ppaValue: sampleLog.leads?.is_from_ppa_project,
          dateRange: { startDate, endDate },
          salesFilter
        }
      });
    }

    // ดึง quotation_documents จาก productivity logs เหล่านั้น
    const logIds = salesLogs?.map(log => log.id) || [];
    let quotations: any[] = [];
    
    if (logIds.length > 0) {
      // ✅ แบ่ง logIds เป็น chunks เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
      const CHUNK_SIZE = 200;
      const logChunks: number[][] = [];
      for (let i = 0; i < logIds.length; i += CHUNK_SIZE) {
        logChunks.push(logIds.slice(i, i + CHUNK_SIZE));
      }

      // ✅ Query quotation documents แบบ sequential เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
      for (const chunk of logChunks) {
        try {
          const { data, error } = await supabase
            .from('quotation_documents')
            .select(`
              amount, 
              productivity_log_id, 
              document_number,
              created_at_thai
            `)
            .in('productivity_log_id', chunk)
            .eq('document_type', 'quotation');

          if (error) {
            console.error(`Error fetching quotations for chunk:`, error);
            // Continue with next chunk instead of failing completely
          } else if (data) {
            quotations = [...quotations, ...data];
          }
        } catch (error) {
          console.error(`Error processing quotations chunk:`, error);
          // Continue with next chunk
        }
      }
    }

    // คำนวณยอดขายรวม (จะคำนวณใหม่จาก salesLeads หลัง deduplication)
    let totalSalesValue = 0;

    // นับจำนวนลีดที่ปิดการขาย (ไม่ซ้ำ)
    const uniqueLeadIds = new Set(salesLogs?.map(log => log.lead_id) || []);
    // const salesCount = uniqueLeadIds.size; // เดิม: นับจากจำนวนลูกค้า

    // ✅ สร้างข้อมูลแยกตาม productivity log แต่ละตัว
    // แต่ละ log จะมีข้อมูล lead และ quotation ของตัวเอง
    const salesLogsWithQuotations = salesLogs?.map(log => {
      // หา quotation ที่เกี่ยวข้องกับ log นี้
      const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
      
      // คำนวณยอดขายของ log นี้
      const logSalesAmount = logQuotations.reduce((sum, q) => sum + (q.amount || 0), 0);
      
      return {
        // ข้อมูล productivity log
        logId: log.id,
        logDate: log.created_at_thai,
        
        // ข้อมูล lead
        leadId: log.lead_id,
        leadName: log.leads.display_name || log.leads.full_name,
        leadFullName: log.leads.full_name,
        leadCategory: log.leads.category,
        leadPlatform: log.leads.platform,
        leadTel: log.leads.tel,
        leadLineId: log.leads.line_id,
        leadIsFromPpaProject: log.leads.is_from_ppa_project || false,
        saleOwnerId: log.leads.sale_owner_id, // เก็บไว้สำหรับ backward compatibility
        saleId: log.sale_id, // ✅ ใช้ sale_id จาก log (คนที่ปิดการขายจริงๆ)
        
        // ข้อมูลยอดขายของ log นี้
        quotations: logQuotations,
        salesAmount: logSalesAmount,
        quotationCount: logQuotations.length
      };
    }) || [];

    // ✅ สร้าง salesLeads แยกตาม log (ไม่ group by leadId)
    // เพื่อให้แสดงแถวแยกตาม QT แต่ละตัว พร้อม sale_id ของแต่ละ QT
    // กรณี lead เดียวกันมีหลาย QT จาก sale คนละคน จะแสดงเป็นหลายแถว
    const salesLeads = salesLogsWithQuotations
      .filter(log => log.quotationCount > 0) // เฉพาะ logs ที่มี quotations
      .map(log => {
        // จัดการ QT ซ้ำใน log เดียวกัน (ถ้ามี)
        const normalizedQuotations = log.quotations.map(q => ({
          ...q,
          normalized_doc: q.document_number?.toLowerCase().replace(/\s+/g, '') || ''
        }));
        
        // ใช้ Map เพื่อเก็บเฉพาะ QT ล่าสุดต่อ normalized_doc
        const uniqueQuotationsMap = new Map();
        normalizedQuotations.forEach(q => {
          const key = `${log.logId}_${q.normalized_doc}`;
          const existing = uniqueQuotationsMap.get(key);
          
          if (!existing || new Date(q.created_at_thai) > new Date(existing.created_at_thai)) {
            uniqueQuotationsMap.set(key, q);
          }
        });
        
        // แปลงกลับเป็น array
        const uniqueQuotations = Array.from(uniqueQuotationsMap.values());
        
        return {
          leadId: log.leadId,
          displayName: log.leadName,
          fullName: log.leadFullName,
          category: log.leadCategory,
          platform: log.leadPlatform,
          tel: log.leadTel,
          lineId: log.leadLineId,
          is_from_ppa_project: log.leadIsFromPpaProject || false,
          saleOwnerId: log.saleOwnerId, // เก็บไว้สำหรับ backward compatibility
          saleId: log.saleId, // ✅ ใช้ sale_id จาก log นี้ (คนที่ปิดการขาย QT นี้)
          lastActivityDate: log.logDate,
          logId: log.logId, // เพิ่ม logId เพื่อระบุว่าเป็น log ไหน
          totalQuotationAmount: uniqueQuotations.reduce((sum, q) => sum + (parseFloat(q.amount) || 0), 0),
          totalQuotationCount: uniqueQuotations.length,
          quotationNumbers: uniqueQuotations.map(q => q.document_number),
          quotationDocuments: uniqueQuotations.map(q => ({
            document_number: q.document_number,
            amount: q.amount?.toString() || '0',
            created_at_thai: q.created_at_thai,
            productivity_log_id: q.productivity_log_id
          }))
        };
      });

    // Debug: Log salesLeads structure
    if (salesLeads && salesLeads.length > 0) {
      const sampleSalesLead = salesLeads[0];
      console.log('📊 getSalesDataInPeriod salesLeads Debug:', {
        totalSalesLeads: salesLeads.length,
        sampleSalesLead: {
          leadId: sampleSalesLead.leadId,
          displayName: sampleSalesLead.displayName,
          is_from_ppa_project: sampleSalesLead.is_from_ppa_project,
          hasField: 'is_from_ppa_project' in sampleSalesLead,
          allFields: Object.keys(sampleSalesLead)
        },
        ppaSalesLeads: salesLeads.filter((lead: any) => lead.is_from_ppa_project === true || lead.is_from_ppa_project === 1).length
      });
    } else {
      console.warn('⚠️ getSalesDataInPeriod: salesLeads is empty', {
        salesLogsCount: salesLogs?.length || 0,
        salesLogsWithQuotationsCount: salesLogsWithQuotations.length,
        quotationsCount: quotations.length,
        dateRange: { startDate, endDate },
        salesFilter
      });
    }

    // คำนวณยอดขายรวมจาก salesLeads ที่ผ่าน deduplication แล้ว
    // ✅ ใช้ totalQuotationAmount ที่คำนวณแล้วจากข้อมูลหลัง deduplication
    totalSalesValue = salesLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);

    // ✅ คำนวณจำนวน QT ที่ปิดการขาย (นับจาก quotationDocuments ของแต่ละ log)
    // ตอนนี้ salesLeads แยกตาม log แล้ว ดังนั้นนับจาก totalQuotationCount ของแต่ละแถว
    const salesCount = salesLeads.reduce((sum, lead) => sum + (lead.totalQuotationCount || 0), 0);

    return {
      salesLogs: salesLogs || [],
      quotations: quotations || [],
      totalSalesValue,
      salesCount,
      uniqueLeadIds: Array.from(uniqueLeadIds),
      salesLogsWithQuotations, // ✅ ข้อมูลใหม่: แยกตาม log แต่ละตัว
      salesLeads // ✅ เพิ่มข้อมูล salesLeads
    };

  } catch (error) {
    console.error('Error in getSalesDataInPeriod:', error);
    return {
      salesLogs: [],
      quotations: [],
      totalSalesValue: 0,
      salesCount: 0,
      uniqueLeadIds: [],
      salesLogsWithQuotations: [], // ✅ เพิ่มข้อมูลใหม่ใน error handling
      salesLeads: [] // ✅ เพิ่มข้อมูล salesLeads ใน error handling
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลปิดการขายไม่สำเร็จ
 * ดึงข้อมูลจาก productivity logs ที่มี status 'ปิดการขายไม่สำเร็จ'
 * และ leads ที่มี status 'ยังปิดการขายไม่สำเร็จ'
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param salesFilter filter ตาม sales member (optional)
 * @param platformFilter filter ตาม platform (optional)
 * @param categoryFilter filter ตาม category (optional)
 * @returns ข้อมูลปิดการขายไม่สำเร็จ
 */
export const getUnsuccessfulSalesDataInPeriod = async (
  startDate: string, 
  endDate: string, 
  salesFilter?: string,
  platformFilter?: string,
  categoryFilter?: string
) => {
  try {
    // ดึง productivity logs ที่มี status 'ปิดการขายไม่สำเร็จ' ในช่วงเวลานั้น
    let unsuccessfulLogsQuery = supabase
      .from('lead_productivity_logs')
      .select(`
        id, 
        lead_id, 
        sale_id,
        created_at_thai,
        leads!inner(
          id,
          sale_owner_id,
          category,
          platform,
          full_name,
          display_name,
          tel,
          line_id,
          status
        )
      `)
      .eq('status', 'ปิดการขายไม่สำเร็จ');

    // Only apply date filter if dates are provided
    if (startDate && endDate) {
      unsuccessfulLogsQuery = unsuccessfulLogsQuery
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);
    }

    // Apply sales filter
    if (salesFilter && salesFilter !== 'all') {
      unsuccessfulLogsQuery = unsuccessfulLogsQuery.eq('sale_id', parseInt(salesFilter));
    }

    // Apply platform filter
    if (platformFilter && platformFilter !== 'all') {
      unsuccessfulLogsQuery = unsuccessfulLogsQuery.eq('leads.platform', platformFilter);
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      unsuccessfulLogsQuery = unsuccessfulLogsQuery.eq('leads.category', categoryFilter);
    }

    const { data: unsuccessfulLogs, error: unsuccessfulLogsError } = await unsuccessfulLogsQuery;

    if (unsuccessfulLogsError) {
      console.error('Error fetching unsuccessful sales logs:', unsuccessfulLogsError);
      throw unsuccessfulLogsError;
    }

    // ดึง quotation_documents จาก productivity logs เหล่านั้น (ถ้ามี)
    const logIds = unsuccessfulLogs?.map(log => log.id) || [];
    let quotations: any[] = [];
    
    if (logIds.length > 0) {
      // ✅ แบ่ง logIds เป็น chunks เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
      const CHUNK_SIZE = 200;
      const logChunks: number[][] = [];
      for (let i = 0; i < logIds.length; i += CHUNK_SIZE) {
        logChunks.push(logIds.slice(i, i + CHUNK_SIZE));
      }

      // ✅ Query quotation documents แบบ sequential เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
      for (const chunk of logChunks) {
        try {
          const { data, error } = await supabase
            .from('quotation_documents')
            .select(`
              amount, 
              productivity_log_id, 
              document_number,
              created_at_thai
            `)
            .in('productivity_log_id', chunk)
            .eq('document_type', 'quotation');

          if (error) {
            console.error(`Error fetching quotations for chunk:`, error);
            // Continue with next chunk instead of failing completely
          } else if (data) {
            quotations = [...quotations, ...data];
          }
        } catch (error) {
          console.error(`Error processing quotations chunk:`, error);
          // Continue with next chunk
        }
      }
    }

    // สร้างข้อมูลแยกตาม productivity log แต่ละตัว
    const unsuccessfulLogsWithQuotations = unsuccessfulLogs?.map(log => {
      // หา quotation ที่เกี่ยวข้องกับ log นี้
      const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
      
      // คำนวณยอด QT ของ log นี้ (ถ้ามี)
      const logQuotationAmount = logQuotations.reduce((sum, q) => sum + (parseFloat(q.amount || '0') || 0), 0);
      
      return {
        // ข้อมูล productivity log
        logId: log.id,
        logDate: log.created_at_thai,
        
        // ข้อมูล lead
        leadId: log.lead_id,
        leadName: log.leads.display_name || log.leads.full_name,
        leadFullName: log.leads.full_name,
        leadCategory: log.leads.category,
        leadPlatform: log.leads.platform,
        leadTel: log.leads.tel,
        leadLineId: log.leads.line_id,
        leadStatus: log.leads.status,
        saleOwnerId: log.leads.sale_owner_id,
        saleId: log.sale_id || log.leads.sale_owner_id || 0,
        
        // ข้อมูล QT ของ log นี้ (ถ้ามี)
        quotations: logQuotations,
        quotationAmount: logQuotationAmount,
        quotationCount: logQuotations.length
      };
    }) || [];

    // สร้าง unsuccessfulLeads แยกตาม log
    const unsuccessfulLeads = unsuccessfulLogsWithQuotations.map(log => {
      // จัดการ QT ซ้ำใน log เดียวกัน (ถ้ามี)
      const normalizedQuotations = log.quotations.map(q => ({
        ...q,
        normalized_doc: q.document_number?.toLowerCase().replace(/\s+/g, '') || ''
      }));
      
      // ใช้ Map เพื่อเก็บเฉพาะ QT ล่าสุดต่อ normalized_doc
      const uniqueQuotationsMap = new Map();
      normalizedQuotations.forEach(q => {
        const key = `${log.logId}_${q.normalized_doc}`;
        const existing = uniqueQuotationsMap.get(key);
        
        if (!existing || new Date(q.created_at_thai) > new Date(existing.created_at_thai)) {
          uniqueQuotationsMap.set(key, q);
        }
      });
      
      // แปลงกลับเป็น array
      const uniqueQuotations = Array.from(uniqueQuotationsMap.values());
      
      return {
        leadId: log.leadId,
        displayName: log.leadName,
        fullName: log.leadFullName,
        category: log.leadCategory,
        platform: log.leadPlatform,
        tel: log.leadTel,
        lineId: log.leadLineId,
        saleOwnerId: log.saleOwnerId,
        saleId: log.saleId,
        lastActivityDate: log.logDate,
        logId: log.logId,
        leadStatus: log.leadStatus,
        totalQuotationAmount: uniqueQuotations.reduce((sum, q) => sum + (parseFloat(q.amount || '0') || 0), 0),
        totalQuotationCount: uniqueQuotations.length,
        quotationNumbers: uniqueQuotations.map(q => q.document_number),
        quotationDocuments: uniqueQuotations.map(q => ({
          document_number: q.document_number,
          amount: q.amount?.toString() || '0',
          created_at_thai: q.created_at_thai,
          productivity_log_id: q.productivity_log_id
        }))
      };
    });

    // คำนวณยอด QT รวม (ถ้ามี)
    const totalQuotationValue = unsuccessfulLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);

    // นับจำนวนลีดที่ปิดการขายไม่สำเร็จ (ไม่ซ้ำ)
    const uniqueLeadIds = new Set(unsuccessfulLogs?.map(log => log.lead_id) || []);
    const unsuccessfulCount = uniqueLeadIds.size;

    return {
      unsuccessfulLogs: unsuccessfulLogs || [],
      quotations: quotations || [],
      totalQuotationValue,
      unsuccessfulCount,
      uniqueLeadIds: Array.from(uniqueLeadIds),
      unsuccessfulLogsWithQuotations,
      unsuccessfulLeads
    };

  } catch (error) {
    console.error('Error in getUnsuccessfulSalesDataInPeriod:', error);
    return {
      unsuccessfulLogs: [],
      quotations: [],
      totalQuotationValue: 0,
      unsuccessfulCount: 0,
      uniqueLeadIds: [],
      unsuccessfulLogsWithQuotations: [],
      unsuccessfulLeads: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลยอดขายตาม category
 * เพิ่มเงื่อนไข sale_chance_status เป็น 'win' หรือ 'win + สินเชื่อ' เพื่อความแม่นยำ
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.)
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลยอดขายตาม category
 */
export const getSalesDataByCategory = async (
  startDate: string,
  endDate: string,
  category: string,
  salesFilter?: string
) => {
  try {
    // ดึง productivity logs ที่มี status 'ปิดการขายแล้ว' และ sale_chance_status เป็น 'win' หรือ 'win + สินเชื่อ' ในช่วงเวลานั้น
    let salesLogsQuery = supabase
      .from('lead_productivity_logs')
      .select(`
        id, 
        lead_id, 
        sale_id,
        created_at_thai,
        leads!inner(
          id,
          sale_owner_id,
          category,
          platform,
          full_name,
          display_name,
          tel,
          line_id
        )
      `)
      .eq('status', 'ปิดการขายแล้ว')
      .or(`sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)`)
      .eq('leads.category', category)
      .gte('created_at_thai', startDate)
      .lte('created_at_thai', endDate);

    // Apply sales filter
    if (salesFilter && salesFilter !== 'all') {
      salesLogsQuery = salesLogsQuery.eq('sale_id', parseInt(salesFilter));
    }

    const { data: salesLogs, error: salesLogsError } = await salesLogsQuery;

    if (salesLogsError) {
      console.error('Error fetching sales logs by category:', salesLogsError);
      throw salesLogsError;
    }

    // ดึง quotations จาก productivity logs เหล่านั้น
    const logIds = salesLogs?.map(log => log.id) || [];
    let quotations: any[] = [];
    
    if (logIds.length > 0) {
      const { data: quotationsData, error: quotationsError } = await supabase
        .from('quotation_documents')
        .select('amount, productivity_log_id, document_number, created_at_thai')
        .in('productivity_log_id', logIds)
        .eq('document_type', 'quotation');

      if (quotationsError) {
        console.error('Error fetching quotation_documents by category:', quotationsError);
        throw quotationsError;
      }

      quotations = quotationsData || [];
    }

    // ✅ สร้าง salesLeads แยกตาม log (ไม่ group by leadId)
    // เพื่อให้แสดงแถวแยกตาม QT แต่ละตัว พร้อม sale_id ของแต่ละ QT
    const salesLogsWithQuotations = salesLogs?.map(log => {
      // หา quotation ที่เกี่ยวข้องกับ log นี้
      const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
      
      // จัดการ QT ซ้ำใน log เดียวกัน (ถ้ามี)
      const normalizedQuotations = logQuotations.map(q => ({
        ...q,
        normalized_doc: q.document_number?.toLowerCase().replace(/\s+/g, '') || ''
      }));
      
      // ใช้ Map เพื่อเก็บเฉพาะ QT ล่าสุดต่อ normalized_doc
      const uniqueQuotationsMap = new Map();
      normalizedQuotations.forEach(q => {
        const key = `${log.id}_${q.normalized_doc}`;
        const existing = uniqueQuotationsMap.get(key);
        
        if (!existing || new Date(q.created_at_thai) > new Date(existing.created_at_thai)) {
          uniqueQuotationsMap.set(key, q);
        }
      });
      
      // แปลงกลับเป็น array
      const uniqueQuotations = Array.from(uniqueQuotationsMap.values());
      
      return {
        leadId: log.lead_id,
        displayName: log.leads.display_name || log.leads.full_name,
        fullName: log.leads.full_name,
        category: log.leads.category,
        platform: log.leads.platform,
        tel: log.leads.tel,
        lineId: log.leads.line_id,
        saleOwnerId: log.leads.sale_owner_id, // เก็บไว้สำหรับ backward compatibility
        saleId: log.sale_id, // ✅ ใช้ sale_id จาก log นี้ (คนที่ปิดการขาย QT นี้)
        lastActivityDate: log.created_at_thai,
        logId: log.id, // เพิ่ม logId เพื่อระบุว่าเป็น log ไหน
        totalQuotationAmount: uniqueQuotations.reduce((sum, q) => sum + (parseFloat(q.amount) || 0), 0),
        totalQuotationCount: uniqueQuotations.length,
        quotationNumbers: uniqueQuotations.map(q => q.document_number),
        quotationDocuments: uniqueQuotations.map(q => ({
          document_number: q.document_number,
          amount: q.amount?.toString() || '0',
          created_at_thai: q.created_at_thai,
          productivity_log_id: q.productivity_log_id
        }))
      };
    }).filter(log => log.totalQuotationCount > 0) || []; // เฉพาะ logs ที่มี quotations

    const salesLeads = salesLogsWithQuotations;

    // คำนวณยอดขายรวมจาก quotationDocuments ที่ผ่าน deduplication แล้ว
    const totalSalesValue = salesLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);

    // นับจำนวนลีดที่ปิดการขาย (ไม่ซ้ำ)
    const uniqueLeadIds = new Set(salesLogs?.map(log => log.lead_id) || []);
    // const salesCount = uniqueLeadIds.size; // เดิม: นับจากจำนวนลูกค้า
    
    // คำนวณจำนวน QT ที่ปิดการขาย (รวมทุก lead หลัง deduplication)
    const salesCount = salesLeads.reduce((sum, lead) => sum + (lead.totalQuotationCount || 0), 0);

    return {
      salesLogs: salesLogs || [],
      quotations: quotations || [], // เก็บไว้เพื่อ compatibility
      totalSalesValue,
      salesCount,
      uniqueLeadIds: Array.from(uniqueLeadIds),
      salesLeads // เพิ่มข้อมูล salesLeads ที่มี quotationDocuments ผ่าน deduplication แล้ว
    };

  } catch (error) {
    console.error('Error in getSalesDataByCategory:', error);
    return {
      salesLogs: [],
      quotations: [],
      totalSalesValue: 0,
      salesCount: 0,
      uniqueLeadIds: [],
      salesLeads: [] // ✅ เพิ่ม salesLeads ใน error handling
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลยอดขายตาม platform
 * เพิ่มเงื่อนไข sale_chance_status เป็น 'win' หรือ 'win + สินเชื่อ' เพื่อความแม่นยำ
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param platform platform ที่ต้องการ (EV, Huawei, etc.)
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลยอดขายตาม platform
 */
export const getSalesDataByPlatform = async (
  startDate: string,
  endDate: string,
  platform: string,
  salesFilter?: string
) => {
  try {
    // ดึง productivity logs ที่มี status 'ปิดการขายแล้ว' และ sale_chance_status เป็น 'win' หรือ 'win + สินเชื่อ' ในช่วงเวลานั้น
    let salesLogsQuery = supabase
      .from('lead_productivity_logs')
      .select(`
        id, 
        lead_id, 
        sale_id,
        created_at_thai,
        leads!inner(
          id,
          sale_owner_id,
          category,
          platform,
          full_name,
          display_name,
          tel,
          line_id
        )
      `)
      .eq('status', 'ปิดการขายแล้ว')
      .or(`sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)`)
      .eq('leads.platform', platform)
      .gte('created_at_thai', startDate)
      .lte('created_at_thai', endDate);

    // Apply sales filter
    if (salesFilter && salesFilter !== 'all') {
      salesLogsQuery = salesLogsQuery.eq('sale_id', parseInt(salesFilter));
    }

    const { data: salesLogs, error: salesLogsError } = await salesLogsQuery;

    if (salesLogsError) {
      console.error('Error fetching sales logs by platform:', salesLogsError);
      throw salesLogsError;
    }

    // ดึง quotations จาก productivity logs เหล่านั้น
    const logIds = salesLogs?.map(log => log.id) || [];
    let quotations: any[] = [];
    
    if (logIds.length > 0) {
      const { data: quotationsData, error: quotationsError } = await supabase
        .from('quotations')
        .select('total_amount, productivity_log_id, payment_method')
        .in('productivity_log_id', logIds);

      if (quotationsError) {
        console.error('Error fetching quotations by platform:', quotationsError);
        throw quotationsError;
      }

      quotations = quotationsData || [];
    }

    // คำนวณยอดขายรวม
    const totalSalesValue = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);

    // นับจำนวนลีดที่ปิดการขาย (ไม่ซ้ำ)
    const uniqueLeadIds = new Set(salesLogs?.map(log => log.lead_id) || []);
    // const salesCount = uniqueLeadIds.size; // เดิม: นับจากจำนวนลูกค้า
    
    // สำหรับ getSalesDataByPlatform ยังคงใช้การนับแบบเดิม (เพราะไม่มี salesLeads)
    const salesCount = uniqueLeadIds.size;

    return {
      salesLogs: salesLogs || [],
      quotations: quotations || [],
      totalSalesValue,
      salesCount,
      uniqueLeadIds: Array.from(uniqueLeadIds)
    };

  } catch (error) {
    console.error('Error in getSalesDataByPlatform:', error);
    return {
      salesLogs: [],
      quotations: [],
      totalSalesValue: 0,
      salesCount: 0,
      uniqueLeadIds: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการออก QT (ใบเสนอราคา)
 * ใช้ข้อมูลจากทุก productivity log ที่มี quotations (ไม่ใช่แค่ log ล่าสุด)
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.) - optional
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลการออก QT ที่ถูกต้อง
 */
export const getQuotationDataInPeriod = async (
  startDate: string,
  endDate: string,
  category?: string,
  salesFilter?: string
) => {
  try {
    // ดึง productivity logs ที่มี quotations ในช่วงเวลานั้น
    let quotationLogsQuery = supabase
      .from('lead_productivity_logs')
      .select(`
        id, 
        lead_id, 
        sale_id,
        created_at_thai,
        leads!inner(
          id,
          sale_owner_id,
          category,
          platform,
          full_name,
          display_name,
          tel,
          line_id,
          status
        )
      `)
      .gte('created_at_thai', startDate)
      .lte('created_at_thai', endDate);

    // Apply category filter if provided
    if (category) {
      quotationLogsQuery = quotationLogsQuery.eq('leads.category', category);
    }

    // Apply sales filter
    if (salesFilter && salesFilter !== 'all') {
      quotationLogsQuery = quotationLogsQuery.eq('sale_id', parseInt(salesFilter));
    }

    const { data: quotationLogs, error: quotationLogsError } = await quotationLogsQuery;

    if (quotationLogsError) {
      console.error('Error fetching quotation logs:', quotationLogsError);
      throw quotationLogsError;
    }

    // ดึง quotations จาก productivity logs เหล่านั้น
    const logIds = quotationLogs?.map(log => log.id) || [];
    let quotations: any[] = [];
    
    if (logIds.length > 0) {
      const { data: quotationsData, error: quotationsError } = await supabase
        .from('quotations')
        .select('total_amount, productivity_log_id, payment_method')
        .in('productivity_log_id', logIds);

      if (quotationsError) {
        console.error('Error fetching quotations:', quotationsError);
        throw quotationsError;
      }

      quotations = quotationsData || [];
    }

    // สร้างข้อมูลแยกตาม productivity log แต่ละตัวที่มี quotations
    const quotationLogsWithQuotations = quotationLogs?.map(log => {
      // หา quotation ที่เกี่ยวข้องกับ log นี้
      const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
      
      // คำนวณยอด QT ของ log นี้
      const logQuotationAmount = logQuotations.reduce((sum, q) => sum + (q.amount || 0), 0);
      
      return {
        // ข้อมูล productivity log
        logId: log.id,
        logDate: log.created_at_thai,
        
        // ข้อมูล lead
        leadId: log.lead_id,
        leadName: log.leads.display_name || log.leads.full_name,
        leadFullName: log.leads.full_name,
        leadCategory: log.leads.category,
        leadPlatform: log.leads.platform,
        leadTel: log.leads.tel,
        leadLineId: log.leads.line_id,
        leadStatus: log.leads.status,
        saleOwnerId: log.leads.sale_owner_id, // เก็บไว้สำหรับ backward compatibility
        saleId: log.sale_id || log.leads.sale_owner_id || 0, // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
        
        // ข้อมูล QT ของ log นี้
        quotations: logQuotations,
        quotationAmount: logQuotationAmount,
        quotationCount: logQuotations.length
      };
    }).filter(log => log.quotationCount > 0) || []; // เฉพาะ logs ที่มี quotations

    // คำนวณยอด QT รวม
    const totalQuotationValue = quotationLogsWithQuotations.reduce((sum, log) => sum + log.quotationAmount, 0);

    // นับจำนวนลีดที่ออก QT (ไม่ซ้ำ)
    const uniqueLeadIds = new Set(quotationLogsWithQuotations.map(log => log.leadId));
    const quotationCount = uniqueLeadIds.size;

    return {
      quotationLogs: quotationLogs || [],
      quotations: quotations || [],
      totalQuotationValue,
      quotationCount,
      uniqueLeadIds: Array.from(uniqueLeadIds),
      quotationLogsWithQuotations // ข้อมูลแยกตาม log แต่ละตัว
    };

  } catch (error) {
    console.error('Error in getQuotationDataInPeriod:', error);
    return {
      quotationLogs: [],
      quotations: [],
      totalQuotationValue: 0,
      quotationCount: 0,
      uniqueLeadIds: [],
      quotationLogsWithQuotations: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการออก QT จาก quotation_documents table
 * แก้ไขปัญหาการนับ QT ซ้ำและให้ข้อมูลที่แม่นยำมากขึ้น
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.) - optional
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลการออก QT ที่ถูกต้องจาก quotation_documents
 */
export const getQuotationDataFromDocuments = async (
  startDate: string,
  endDate: string,
  category?: string,
  salesFilter?: string
) => {
  try {
    // 1. ดึง productivity logs ที่มี quotation_documents
    let quotationLogsQuery = supabase
      .from('lead_productivity_logs')
      .select(`
        id, 
        lead_id, 
        sale_id,
        created_at_thai,
        leads!inner(
          id,
          sale_owner_id,
          category,
          platform,
          full_name,
          display_name,
          tel,
          line_id,
          status
        )
      `)
      .gte('created_at_thai', startDate)
      .lte('created_at_thai', endDate);

    // Apply filters
    if (category) {
      quotationLogsQuery = quotationLogsQuery.eq('leads.category', category);
    }
    if (salesFilter && salesFilter !== 'all') {
      quotationLogsQuery = quotationLogsQuery.eq('sale_id', parseInt(salesFilter));
    }

    const { data: quotationLogs, error: quotationLogsError } = await quotationLogsQuery;

    if (quotationLogsError) {
      console.error('Error fetching quotation logs:', quotationLogsError);
      throw quotationLogsError;
    }

    // 2. ดึง quotation_documents จาก productivity logs
    const logIds = quotationLogs?.map(log => log.id) || [];
    let quotationDocuments: any[] = [];
    
    if (logIds.length > 0) {
      // ✅ แบ่ง logIds เป็น chunks เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
      const CHUNK_SIZE = 200;
      const logChunks: number[][] = [];
      for (let i = 0; i < logIds.length; i += CHUNK_SIZE) {
        logChunks.push(logIds.slice(i, i + CHUNK_SIZE));
      }

      // ✅ Query quotation documents แบบ sequential เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
      for (const chunk of logChunks) {
        try {
          const { data, error } = await supabase
            .from('quotation_documents')
            .select('id, productivity_log_id, document_type, document_number, amount, created_at_thai')
            .in('productivity_log_id', chunk)
            .eq('document_type', 'quotation'); // เฉพาะ quotation

          if (error) {
            console.error(`Error fetching quotation documents for chunk:`, error);
            // Continue with next chunk instead of failing completely
          } else if (data) {
            quotationDocuments = [...quotationDocuments, ...data];
          }
        } catch (error) {
          console.error(`Error processing quotation documents chunk:`, error);
          // Continue with next chunk
        }
      }
    }

    // 3. สร้างข้อมูลแยกตาม productivity log แต่ละตัว
    const quotationLogsWithQuotations = quotationLogs?.map(log => {
      // หา quotation documents ที่เกี่ยวข้องกับ log นี้
      const logDocuments = quotationDocuments.filter(doc => doc.productivity_log_id === log.id);
      
      // คำนวณยอด QT ของ log นี้ (รวมจากทุก QT)
      const logQuotationAmount = logDocuments.reduce((sum, doc) => sum + parseFloat(doc.amount || '0'), 0);
      
      return {
        // ข้อมูล productivity log
        logId: log.id,
        logDate: log.created_at_thai,
        
        // ข้อมูล lead
        leadId: log.lead_id,
        leadName: log.leads.display_name || log.leads.full_name,
        leadFullName: log.leads.full_name,
        leadCategory: log.leads.category,
        leadPlatform: log.leads.platform,
        leadTel: log.leads.tel,
        leadLineId: log.leads.line_id,
        leadStatus: log.leads.status,
        saleOwnerId: log.leads.sale_owner_id, // เก็บไว้สำหรับ backward compatibility
        saleId: log.sale_id || log.leads.sale_owner_id || 0, // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
        
        // ข้อมูล QT ของ log นี้
        quotationDocuments: logDocuments,
        quotationAmount: logQuotationAmount,
        quotationCount: logDocuments.length, // จำนวน QT จริง
        quotationNumbers: logDocuments.map(doc => doc.document_number) // หมายเลข QT ทั้งหมด
      };
    }).filter(log => log.quotationCount > 0) || []; // เฉพาะ logs ที่มี QT

    // 4. คำนวณยอด QT รวม
    const totalQuotationValue = quotationLogsWithQuotations.reduce((sum, log) => sum + log.quotationAmount, 0);

    // 5. นับจำนวนลีดที่ออก QT (ไม่ซ้ำ)
    const uniqueLeadIds = new Set(quotationLogsWithQuotations.map(log => log.leadId));
    const quotationCount = uniqueLeadIds.size;

    return {
      quotationLogs: quotationLogs || [],
      quotations: quotationDocuments || [], // เพิ่มเพื่อ compatibility กับ function เก่า
      quotationDocuments: quotationDocuments || [],
      totalQuotationValue,
      quotationCount,
      uniqueLeadIds: Array.from(uniqueLeadIds),
      quotationLogsWithQuotations // ข้อมูลแยกตาม log แต่ละตัว
    };

  } catch (error) {
    console.error('Error in getQuotationDataFromDocuments:', error);
    return {
      quotationLogs: [],
      quotations: [], // เพิ่มเพื่อ compatibility กับ function เก่า
      quotationDocuments: [],
      totalQuotationValue: 0,
      quotationCount: 0,
      uniqueLeadIds: [],
      quotationLogsWithQuotations: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลโอกาสการขาย (Opportunity)
 * ใช้ข้อมูลจาก quotation_documents เพื่อความแม่นยำ
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.) - optional
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลโอกาสการขายที่ถูกต้อง
 */
export const getOpportunityDataInPeriod = async (
  startDate: string,
  endDate: string,
  category?: string,
  salesFilter?: string
) => {
  try {
    // ใช้ function ใหม่ที่ใช้ quotation_documents
    const quotationData = await getQuotationDataFromDocuments(startDate, endDate, category, salesFilter);
    
    // กรองเฉพาะ logs ที่ยังไม่ปิดการขาย (โอกาสการขาย)
    const opportunityLogsWithQuotations = quotationData.quotationLogsWithQuotations.filter(log => 
      log.leadStatus !== 'ปิดการขาย' && 
      log.leadStatus !== 'ปิดการขายไม่สำเร็จ' && 
      log.leadStatus !== 'รอรับ'
    );

    // คำนวณยอดโอกาสการขายรวม (ไม่ซ้ำ)
    const totalOpportunityValue = opportunityLogsWithQuotations.reduce((sum, log) => sum + log.quotationAmount, 0);

    // นับจำนวนลีดที่มีโอกาสการขาย (ไม่ซ้ำ)
    const uniqueOpportunityLeadIds = new Set(opportunityLogsWithQuotations.map(log => log.leadId));
    const opportunityCount = uniqueOpportunityLeadIds.size;

    return {
      opportunityLogs: opportunityLogsWithQuotations,
      totalOpportunityValue,
      opportunityCount,
      uniqueOpportunityLeadIds: Array.from(uniqueOpportunityLeadIds),
      opportunityLogsWithQuotations // ข้อมูลแยกตาม log แต่ละตัว
    };

  } catch (error) {
    console.error('Error in getOpportunityDataInPeriod:', error);
    return {
      opportunityLogs: [],
      totalOpportunityValue: 0,
      opportunityCount: 0,
      uniqueOpportunityLeadIds: [],
      opportunityLogsWithQuotations: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการออก QT จาก view lead_qt_itemized
 * ใช้ view ที่ทำ deduplication แล้วเพื่อความแม่นยำสูงสุด
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.) - optional
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลการออก QT ที่ถูกต้องจาก view lead_qt_itemized
 */
export const getQuotationDataFromView = async (
  startDate: string,
  endDate: string,
  category?: string,
  salesFilter?: string
) => {
  try {
    // Debug logs removed for performance
    
    // 1. ดึงข้อมูลจาก view lead_qt_itemized
    let viewQuery = supabase
      .from('lead_qt_itemized')
      .select(`
        lead_id,
        customer_name,
        category,
        operation_status,
        lead_status,
        document_number,
        amount,
        created_at_thai,
        log_id,
        last_activity_date
      `)
      .gte('created_at_thai', startDate)
      .lte('created_at_thai', endDate);

    // Apply category filter if provided
    if (category) {
      viewQuery = viewQuery.eq('category', category);
    }

    const { data: viewData, error: viewError } = await viewQuery;

    if (viewError) {
      console.error('Error fetching from lead_qt_itemized view:', viewError);
      throw viewError;
    }

    // Debug logs removed for performance

    // 2. ดึงข้อมูล lead และ productivity logs เพิ่มเติม
    let leadIds = [...new Set(viewData?.map(item => item.lead_id) || [])];
    let logIds = [...new Set(viewData?.map(item => item.log_id).filter(id => id !== null) || [])];
    
    // ดึงข้อมูล leads เพิ่มเติม (รวม sale_owner_id, tel, line_id, platform)
    let leadsData: any[] = [];
    if (leadIds.length > 0) {
      const { data: leadsResult, error: leadsError } = await supabase
        .from('leads')
        .select('id, sale_owner_id, tel, line_id, platform, display_name, full_name')
        .in('id', leadIds);

      if (leadsError) {
        console.error('Error fetching leads data:', leadsError);
        throw leadsError;
      }

      leadsData = leadsResult || [];
    }
    
    // ✅ ดึงข้อมูล sale_id จาก productivity logs (ใช้ log_id จาก view)
    // ดึงทุกครั้ง (ไม่ใช่แค่ตอน filter) เพื่อให้ได้ saleId สำหรับทุก QT
    let logsWithSaleId: Map<number, number> = new Map();
    if (logIds.length > 0) {
      const { data: logsData, error: logsError } = await supabase
        .from('lead_productivity_logs')
        .select('id, sale_id')
        .in('id', logIds);

      if (logsError) {
        console.error('Error fetching productivity logs data:', logsError);
        throw logsError;
      }

      // สร้าง Map สำหรับ lookup sale_id จาก log_id
      logsData?.forEach(log => {
        if (log.sale_id) {
          logsWithSaleId.set(log.id, log.sale_id);
        }
      });
    }
    
    // Filter leads based on sales filter if provided
    // ใช้ sale_id จาก productivity logs แทน sale_owner_id จาก leads
    let filteredViewData = viewData || [];
    if (salesFilter && salesFilter !== 'all') {
      const salesFilterId = parseInt(salesFilter);
      // Filter view data โดยใช้ sale_id จาก productivity logs
      filteredViewData = viewData?.filter(item => {
        if (item.log_id && logsWithSaleId.has(item.log_id)) {
          return logsWithSaleId.get(item.log_id) === salesFilterId;
        }
        return false;
      }) || [];
      
      // อัพเดต leadIds ให้ตรงกับ filtered data
      const filteredLeadIds = new Set(filteredViewData.map(item => item.lead_id));
      leadIds = leadIds.filter(id => filteredLeadIds.has(id));
    }

    // 3. สร้างข้อมูลแยกตาม lead (ไม่ซ้ำ)
    const leadQuotationMap = new Map();
    
    filteredViewData.forEach(item => {
      const leadId = item.lead_id;
      
      if (leadQuotationMap.has(leadId)) {
        // รวมข้อมูล QT ของ lead เดียวกัน
        const existing = leadQuotationMap.get(leadId);
        existing.totalQuotationAmount += parseFloat(String(item.amount || '0'));
        existing.totalQuotationCount += 1;
        existing.quotationNumbers.push(item.document_number);
        
        // ✅ หา sale_id จาก productivity log ที่เกี่ยวข้องกับ QT นี้
        const saleId = item.log_id ? logsWithSaleId.get(item.log_id) || null : null;
        
        existing.quotationItems.push({
          documentNumber: item.document_number,
          amount: parseFloat(String(item.amount || '0')),
          created_at_thai: item.created_at_thai,
          log_id: item.log_id,
          sale_id: saleId // ✅ เก็บ sale_id ของ QT นี้
        });
        
        // ✅ อัพเดต saleId ให้เป็นของ QT ล่าสุด (ถ้า QT นี้ใหม่กว่า)
        if (new Date(item.created_at_thai) > new Date(existing.lastActivityDate)) {
          existing.lastActivityDate = item.created_at_thai;
          existing.saleId = saleId || existing.saleId; // ✅ อัพเดต saleId จาก QT ล่าสุด
        }
      } else {
        // หาข้อมูล lead เพิ่มเติม
        const leadInfo = leadsData.find(lead => lead.id === leadId);
        
        // ✅ หา sale_id จาก productivity log ที่เกี่ยวข้องกับ QT นี้
        const saleId = item.log_id ? logsWithSaleId.get(item.log_id) || null : null;
        
        // สร้างข้อมูล lead ใหม่
        leadQuotationMap.set(leadId, {
          leadId: leadId,
          customerName: item.customer_name,
          category: item.category,
          operationStatus: item.operation_status,
          leadStatus: item.lead_status,
          totalQuotationAmount: parseFloat(String(item.amount || '0')),
          totalQuotationCount: 1,
          quotationNumbers: [item.document_number],
          quotationItems: [{
            documentNumber: item.document_number,
            amount: parseFloat(String(item.amount || '0')),
            created_at_thai: item.created_at_thai,
            log_id: item.log_id,
            sale_id: saleId // ✅ เก็บ sale_id ของ QT นี้
          }],
          lastActivityDate: item.created_at_thai,
          // เพิ่มข้อมูลจาก leads table
          saleOwnerId: leadInfo?.sale_owner_id || 0,
          saleId: saleId || leadInfo?.sale_owner_id || 0, // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
          tel: leadInfo?.tel || 'ไม่ระบุ',
          lineId: leadInfo?.line_id || 'ไม่ระบุ',
          platform: leadInfo?.platform || 'ไม่ระบุ',
          displayName: leadInfo?.display_name || item.customer_name,
          fullName: leadInfo?.full_name || item.customer_name
        });
      }
    });

    const quotationLeads = Array.from(leadQuotationMap.values()).map(lead => ({
      ...lead,
      quotationDocuments: lead.quotationItems.map(item => ({
        document_number: item.documentNumber,
        amount: item.amount.toString(),
        created_at_thai: item.created_at_thai,
        productivity_log_id: item.log_id
      }))
    }));

    // 4. คำนวณยอดรวม
    const totalQuotationValue = quotationLeads.reduce((sum, lead) => sum + lead.totalQuotationAmount, 0);
    const quotationCount = quotationLeads.length; // จำนวน lead ที่มี QT (ไม่ซ้ำ)

    // 5. สร้างข้อมูลสำหรับ compatibility กับระบบเดิม
    const quotationLogsWithQuotations = quotationLeads.map(lead => ({
      logId: lead.quotationItems[0]?.log_id || 0, // ใช้ log_id จาก QT ล่าสุด
      logDate: lead.lastActivityDate,
      
      // ข้อมูล lead
      leadId: lead.leadId,
      leadName: lead.displayName || lead.customerName,
      leadFullName: lead.fullName || lead.customerName,
      leadCategory: lead.category,
      leadPlatform: lead.platform || 'ไม่ระบุ',
      leadTel: lead.tel || 'ไม่ระบุ',
      leadLineId: lead.lineId || 'ไม่ระบุ',
      leadStatus: lead.leadStatus,
      saleOwnerId: lead.saleOwnerId || 0, // เก็บไว้สำหรับ backward compatibility
      saleId: lead.saleId || lead.saleOwnerId || 0, // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
      
      // ข้อมูล QT ของ lead นี้
      quotationDocuments: lead.quotationItems.map(item => ({
        document_number: item.documentNumber,
        amount: item.amount.toString(),
        created_at_thai: item.created_at_thai,
        productivity_log_id: item.log_id
      })),
      quotationAmount: lead.totalQuotationAmount,
      quotationCount: lead.totalQuotationCount,
      quotationNumbers: lead.quotationNumbers
    }));

    // Debug logs removed for performance

    return {
      quotationLogs: [], // ไม่ใช้ในระบบใหม่
      quotations: filteredViewData || [], // ข้อมูลจาก view
      quotationDocuments: filteredViewData || [], // ข้อมูลจาก view
      totalQuotationValue,
      quotationCount,
      uniqueLeadIds: Array.from(leadQuotationMap.keys()),
      quotationLogsWithQuotations, // ข้อมูลแยกตาม lead (ไม่ซ้ำ)
      quotationLeads // ข้อมูล lead ที่มี QT
    };

  } catch (error) {
    console.error('Error in getQuotationDataFromView:', error);
    return {
      quotationLogs: [],
      quotations: [],
      quotationDocuments: [],
      totalQuotationValue: 0,
      quotationCount: 0,
      uniqueLeadIds: [],
      quotationLogsWithQuotations: [],
      quotationLeads: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลโอกาสการขายจาก view lead_qt_itemized
 * ใช้ view ที่ทำ deduplication แล้วเพื่อความแม่นยำสูงสุด
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.) - optional
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลโอกาสการขายที่ถูกต้องจาก view lead_qt_itemized
 */
export const getOpportunityDataFromView = async (
  startDate: string,
  endDate: string,
  category?: string,
  salesFilter?: string
) => {
  try {
    // ใช้ function ใหม่ที่ใช้ view
    const quotationData = await getQuotationDataFromView(startDate, endDate, category, salesFilter);
    
    // กรองเฉพาะ leads ที่ยังไม่ปิดการขาย (โอกาสการขาย)
    // ใช้เงื่อนไขที่ยืดหยุ่นมากขึ้น
    const opportunityLeads = quotationData.quotationLeads.filter(lead => {
      const status = lead.leadStatus?.toLowerCase() || '';
      return !status.includes('ปิดการขาย') && 
             !status.includes('ปิดการขายไม่สำเร็จ') && 
             !status.includes('รอรับ') &&
             !status.includes('closed') &&
             !status.includes('won');
    });

    // คำนวณยอดโอกาสการขายรวม
    const totalOpportunityValue = opportunityLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);
    const opportunityCount = opportunityLeads.length;

    // สร้างข้อมูลสำหรับ compatibility กับระบบเดิม
    const opportunityLogsWithQuotations = opportunityLeads.map(lead => ({
      logId: lead.quotationItems?.[0]?.log_id || 0,
      logDate: lead.lastActivityDate,
      
      // ข้อมูล lead
      leadId: lead.leadId,
      leadName: lead.customerName,
      leadFullName: lead.customerName,
      leadCategory: lead.category,
      leadPlatform: lead.platform || 'ไม่ระบุ',
      leadTel: lead.tel || 'ไม่ระบุ',
      leadLineId: lead.lineId || 'ไม่ระบุ',
      leadStatus: lead.leadStatus,
      saleOwnerId: lead.saleOwnerId || 0, // เก็บไว้สำหรับ backward compatibility
      saleId: lead.saleId || lead.saleOwnerId || 0, // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
      
      // ข้อมูล QT ของ lead นี้
      quotationDocuments: (lead.quotationItems || []).map(item => ({
        document_number: item.documentNumber,
        amount: item.amount.toString(),
        created_at_thai: item.created_at_thai,
        productivity_log_id: item.log_id
      })),
      quotationAmount: lead.totalQuotationAmount || 0,
      quotationCount: lead.totalQuotationCount || 0,
      quotationNumbers: lead.quotationNumbers || []
    }));


    return {
      opportunityLogs: opportunityLogsWithQuotations,
      totalOpportunityValue,
      opportunityCount,
      uniqueOpportunityLeadIds: opportunityLeads.map(lead => lead.leadId),
      opportunityLogsWithQuotations, // ข้อมูลแยกตาม lead (ไม่ซ้ำ)
      opportunityLeads // ข้อมูล lead ที่มีโอกาสการขาย
    };

  } catch (error) {
    console.error('Error in getOpportunityDataFromView:', error);
    return {
      opportunityLogs: [],
      totalOpportunityValue: 0,
      opportunityCount: 0,
      uniqueOpportunityLeadIds: [],
      opportunityLogsWithQuotations: [],
      opportunityLeads: []
    };
  }
};

/**
 * ฟังก์ชันสำหรับทดสอบและเปรียบเทียบผลลัพธ์ระหว่างระบบเก่าและใหม่
 * ใช้เพื่อตรวจสอบความถูกต้องของการปรับปรุง
 * 
 * @param startDate วันที่เริ่มต้น
 * @param endDate วันที่สิ้นสุด
 * @param category category ที่ต้องการ (Package, Wholesale, etc.) - optional
 * @param salesFilter filter ตาม sales member (optional)
 * @returns ข้อมูลเปรียบเทียบระหว่างระบบเก่าและใหม่
 */
export const compareQuotationData = async (
  startDate: string,
  endDate: string,
  category?: string,
  salesFilter?: string
) => {
  try {
    // Debug logs removed for performance
    
    // ดึงข้อมูลจากระบบเก่า (quotations table)
    const oldQuotationData = await getQuotationDataInPeriod(startDate, endDate, category, salesFilter);
    
    // ดึงข้อมูลจากระบบใหม่ (quotation_documents table)
    const newQuotationData = await getQuotationDataFromDocuments(startDate, endDate, category, salesFilter);
    
    // เปรียบเทียบผลลัพธ์
    const comparison = {
      // ข้อมูลระบบเก่า
      oldSystem: {
        totalQuotationValue: oldQuotationData.totalQuotationValue,
        quotationCount: oldQuotationData.quotationCount,
        logsCount: oldQuotationData.quotationLogsWithQuotations.length,
        uniqueLeads: oldQuotationData.uniqueLeadIds.length
      },
      
      // ข้อมูลระบบใหม่
      newSystem: {
        totalQuotationValue: newQuotationData.totalQuotationValue,
        quotationCount: newQuotationData.quotationCount,
        logsCount: newQuotationData.quotationLogsWithQuotations.length,
        uniqueLeads: newQuotationData.uniqueLeadIds.length,
        totalDocuments: newQuotationData.quotationDocuments.length
      },
      
      // การเปรียบเทียบ
      differences: {
        valueDifference: newQuotationData.totalQuotationValue - oldQuotationData.totalQuotationValue,
        countDifference: newQuotationData.quotationCount - oldQuotationData.quotationCount,
        logsDifference: newQuotationData.quotationLogsWithQuotations.length - oldQuotationData.quotationLogsWithQuotations.length
      },
      
      // รายละเอียดเพิ่มเติม
      details: {
        oldLogs: oldQuotationData.quotationLogsWithQuotations.map(log => ({
          logId: log.logId,
          leadId: log.leadId,
          leadName: log.leadName,
          quotationAmount: log.quotationAmount,
          quotationCount: log.quotationCount
        })),
        
        newLogs: newQuotationData.quotationLogsWithQuotations.map(log => ({
          logId: log.logId,
          leadId: log.leadId,
          leadName: log.leadName,
          quotationAmount: log.quotationAmount,
          quotationCount: log.quotationCount,
          quotationNumbers: log.quotationNumbers,
          quotationDocuments: log.quotationDocuments.map(doc => ({
            documentNumber: doc.document_number,
            amount: doc.amount
          }))
        }))
      }
    };
    
    // Debug logs removed for performance
    
    // ตรวจสอบความถูกต้อง
    const isDataConsistent = Math.abs(comparison.differences.valueDifference) < 0.01; // อนุญาตความแตกต่างเล็กน้อย
    // Debug logs removed for performance
    
    return {
      ...comparison,
      isDataConsistent,
      recommendation: isDataConsistent 
        ? '✅ ระบบใหม่ทำงานถูกต้อง สามารถใช้งานได้'
        : '⚠️ พบความแตกต่าง ควรตรวจสอบข้อมูลเพิ่มเติม'
    };
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการเปรียบเทียบ:', error);
    return {
      error: error.message,
      recommendation: '❌ เกิดข้อผิดพลาด ควรตรวจสอบระบบ'
    };
  }
};
