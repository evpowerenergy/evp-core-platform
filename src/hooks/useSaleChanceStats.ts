import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

interface SaleChanceData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface UseSaleChanceStatsParams {
  dateRange?: DateRange | undefined;
  salesFilter?: string;
  category?: string;
  creatorFilter?: string;
}

export const useSaleChanceStats = (params?: UseSaleChanceStatsParams) => {
  const { dateRange, salesFilter = 'all', category = 'Package', creatorFilter = 'all' } = params || {};
  const [saleChanceData, setSaleChanceData] = useState<SaleChanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaleChanceStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use DateRange object for date filtering
      let startDate: string, endDate: string;
      
      if (dateRange && dateRange.from) {
        const fromDate = dateRange.from;
        const toDate = dateRange.to || dateRange.from;
        
        // Use Intl.DateTimeFormat with Thailand timezone to get correct dates
        const formatter = new Intl.DateTimeFormat('sv-SE', {
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
        // Default to today if no date range selected
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const today = new Date();
        const todayString = formatter.format(today);
        
        startDate = todayString + 'T00:00:00.000';
        endDate = todayString + 'T23:59:59.999';
      }

      // ✅ ใช้ sale_id จาก productivity logs แทน leads.sale_owner_id
      let query = supabase
        .from('lead_productivity_logs')
        .select(`
          sale_chance_status,
          sale_id,
          created_at_thai,
          leads!inner(
            id,
            category
          )
        `)
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate)
        .not('sale_chance_status', 'is', null);

      // Handle category filtering - support both 'Wholesale' and 'Wholesales'
      if (category === 'Wholesale') {
        query = query.in('leads.category', ['Wholesale', 'Wholesales']);
      } else {
        query = query.eq('leads.category', category);
      }

      // Apply sales filter - ใช้ sale_id จาก productivity logs
      if (salesFilter !== 'all') {
        query = query.eq('sale_id', parseInt(salesFilter));
      }

      if (creatorFilter !== 'all') {
        query = query.eq('leads.created_by', creatorFilter);
      }

      const { data, error } = await query;

      // Debug logging


      if (error) {
        console.error('Error fetching sale chance stats:', error);
        setError('ไม่สามารถโหลดข้อมูลได้');
        return;
      }

      // Process the data to count occurrences
      const statusCounts: { [key: string]: number } = {};
      let totalCount = 0;

      // Debug logging for data processing


      data?.forEach(log => {
        if (log.sale_chance_status) {
          statusCounts[log.sale_chance_status] = (statusCounts[log.sale_chance_status] || 0) + 1;
          totalCount++;
        }
      });



      // Convert to chart data format
      const chartData: SaleChanceData[] = Object.entries(statusCounts)
        .map(([status, count]) => ({
          name: status,
          value: count,
          color: getStatusColor(status),
          percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value); // Sort by count descending


      setSaleChanceData(chartData);
    } catch (err) {
      console.error('Error:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'win': '#10B981', // Green for wins
      'win + สินเชื่อ': '#0D9488', // Teal for win + credit (different from win)
      'มัดจำเงิน': '#16A34A', // Emerald for deposit (different from win)
      'CXL': '#EF4444', // Red for cancellations
      'ติดตามต่อ': '#F59E0B', // Orange for follow up
      'รอติดต่อกลับ': '#8B5CF6', // Purple for waiting
      'ไม่สนใจ': '#6B7280', // Gray for not interested
      'อื่นๆ': '#06B6D4', // Cyan for others
      'มากกว่า 50%': '#22C55E', // Bright green
      '50:50': '#F97316', // Bright orange
      'น้อยกว่า 50%': '#EAB308', // Yellow
    };

    return colorMap[status] || '#6366F1'; // Default indigo instead of purple
  };

  useEffect(() => {
    fetchSaleChanceStats();
  }, [dateRange, salesFilter, category, creatorFilter]);

  // Refetch when dateRange changes
  useEffect(() => {
    if (dateRange) {
      fetchSaleChanceStats();
    }
  }, [dateRange]);

  return {
    saleChanceData,
    loading,
    error,
    refetch: fetchSaleChanceStats
  };
}; 