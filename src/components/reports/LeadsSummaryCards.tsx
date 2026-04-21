import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import { 
  calculateTotalLeads, 
  calculateAssignedLeads, 
  calculateUnassignedLeads, 
  calculateAssignmentRate,
  calculateLeadsByStatus,
  calculateLeadsByPlatform
} from "@/utils/leadValidation";
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Facebook, 
  Instagram, 
  Globe, 
  Phone,
  MessageCircle,
  ShoppingCart,
  Youtube,
  Hash,
  BarChart3,
  PieChart as PieChartIcon,
  MapPin,
  Package,
  Building
} from "lucide-react";

interface LeadSummary {
  platform: string;
  total: number;
  assigned: number;
  unassigned: number;
  percentage: number;
}

interface LeadsSummaryCardsProps {
  leads: any[];
}

const LeadsSummaryCards = ({ leads }: LeadsSummaryCardsProps) => {
  // คำนวณสถิติรวม (ต้องมีเบอร์โทร)
  const totalLeads = calculateTotalLeads(leads, true);
  const assignedLeads = calculateAssignedLeads(leads, true);
  const unassignedLeads = calculateUnassignedLeads(leads, true);
  const assignmentRate = calculateAssignmentRate(leads, true);

  // คำนวณสถิติแยกตามแพลตฟอร์ม (ไม่ต้องกรอง tel แล้ว เพราะข้อมูลจาก props ถูกกรองแล้ว)
  const platformStats = React.useMemo(() => {
    const validLeads = leads;
    const platformMap = new Map<string, { total: number; assigned: number; unassigned: number }>();
    
    validLeads.forEach(lead => {
      const platform = lead.platform || 'ไม่ระบุ';
      if (!platformMap.has(platform)) {
        platformMap.set(platform, { total: 0, assigned: 0, unassigned: 0 });
      }
      
      const stats = platformMap.get(platform)!;
      stats.total += 1;
      
      if (lead.sale_owner_id) {
        stats.assigned += 1;
      } else {
        stats.unassigned += 1;
      }
    });

    return Array.from(platformMap.entries()).map(([platform, stats]) => ({
      platform,
      total: stats.total,
      assigned: stats.assigned,
      unassigned: stats.unassigned,
      percentage: stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0
    })).sort((a, b) => b.total - a.total); // เรียงตามจำนวนลีดมากไปน้อย
  }, [leads]);

  // คำนวณสถิติแยกตามหมวดหมู่ (Package vs Wholesale) (ไม่ต้องกรอง tel แล้ว)
  const categoryStats = React.useMemo(() => {
    const validLeads = leads;
    const categoryMap = new Map<string, { total: number; assigned: number; unassigned: number }>();
    
    validLeads.forEach(lead => {
      const category = lead.category || 'ไม่ระบุ';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, assigned: 0, unassigned: 0 });
      }
      
      const stats = categoryMap.get(category)!;
      stats.total += 1;
      
      if (lead.sale_owner_id) {
        stats.assigned += 1;
      } else {
        stats.unassigned += 1;
      }
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      assigned: stats.assigned,
      unassigned: stats.unassigned,
      percentage: stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0
    })).sort((a, b) => b.total - a.total); // เรียงตามจำนวนลีดมากไปน้อย
  }, [leads]);

  // คำนวณสถิติแยกตามจังหวัด (ไม่ต้องกรอง tel แล้ว)
  const regionStats = React.useMemo(() => {
    const validLeads = leads;
    const regionMap = new Map<string, { total: number; assigned: number; unassigned: number }>();
    
    validLeads.forEach(lead => {
      const region = lead.region || 'ไม่ระบุ';
      if (!regionMap.has(region)) {
        regionMap.set(region, { total: 0, assigned: 0, unassigned: 0 });
      }
      
      const stats = regionMap.get(region)!;
      stats.total += 1;
      
      if (lead.sale_owner_id) {
        stats.assigned += 1;
      } else {
        stats.unassigned += 1;
      }
    });

    return Array.from(regionMap.entries()).map(([region, stats]) => ({
      region,
      total: stats.total,
      assigned: stats.assigned,
      unassigned: stats.unassigned,
      percentage: stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0
    })).sort((a, b) => b.total - a.total); // เรียงตามจำนวนลีดมากไปน้อย
  }, [leads]);

  // ฟังก์ชันสำหรับเลือกสีตาม platform
  const getPlatformColor = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('facebook') || platformLower.includes('fb')) return '#1877F2';
    if (platformLower.includes('instagram') || platformLower.includes('ig')) return '#E4405F';
    if (platformLower.includes('website') || platformLower.includes('web')) return '#10B981';
    if (platformLower.includes('phone') || platformLower.includes('tel')) return '#6B7280';
    if (platformLower.includes('line')) return '#00B900';
    if (platformLower.includes('shopee')) return '#EE4D2D';
    if (platformLower.includes('youtube') || platformLower.includes('yt')) return '#FF0000';
    if (platformLower.includes('huawei')) return '#FF0000';
    if (platformLower.includes('lazada')) return '#0F146D';
    if (platformLower.includes('atmoce')) return '#06B6D4';
    if (platformLower.includes('solvana')) return '#10B981';
    if (platformLower.includes('solar edge')) return '#FCD34D';
    if (platformLower.includes('sigenergy')) return '#8B5CF6';
    if (platformLower.includes('terawatt')) return '#14B8A6';
    return '#8B5CF6';
  };

  // ฟังก์ชันสำหรับเลือกสีตามจังหวัด (ใช้สีที่แตกต่างกัน)
  const getRegionColor = (index: number) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
      '#14B8A6', '#F43F5E', '#A855F7', '#0EA5E9', '#22C55E'
    ];
    return colors[index % colors.length];
  };

  // เตรียมข้อมูลสำหรับ Pie Chart การรับลีด (Assigned vs Unassigned)
  const assignmentPieChartData = [
    {
      name: 'รับแล้ว',
      value: assignedLeads,
      color: '#10B981',
      percentage: assignmentRate
    },
    {
      name: 'ยังไม่ได้รับ',
      value: unassignedLeads,
      color: '#F59E0B',
      percentage: 100 - assignmentRate
    }
  ];

  // เตรียมข้อมูลสำหรับ Pie Chart แพลตฟอร์ม
  const platformPieChartData = platformStats.map(stat => ({
    name: stat.platform,
    value: stat.total,
    color: getPlatformColor(stat.platform),
    assigned: stat.assigned,
    unassigned: stat.unassigned,
    percentage: stat.total > 0 ? (stat.total / totalLeads) * 100 : 0
  }));

  // เตรียมข้อมูลสำหรับ Pie Chart หมวดหมู่
  const categoryPieChartData = categoryStats.map((stat, index) => ({
    name: stat.category,
    value: stat.total,
    color: stat.category === 'Package' ? '#3B82F6' : stat.category === 'Wholesale' ? '#8B5CF6' : '#6B7280',
    assigned: stat.assigned,
    unassigned: stat.unassigned,
    percentage: stat.total > 0 ? (stat.total / totalLeads) * 100 : 0
  }));

  // เตรียมข้อมูลสำหรับ Pie Chart จังหวัด
  const regionPieChartData = regionStats.map((stat, index) => ({
    name: stat.region,
    value: stat.total,
    color: getRegionColor(index),
    assigned: stat.assigned,
    unassigned: stat.unassigned,
    percentage: stat.total > 0 ? (stat.total / totalLeads) * 100 : 0
  }));






  return (
    <div className="space-y-4">
      {/* สรุปรวม */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">ลีดทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-blue-700">รายการทั้งหมด</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">รับแล้ว</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{assignedLeads.toLocaleString()}</div>
            <p className="text-xs text-green-700">{assignmentRate.toFixed(1)}% ของทั้งหมด</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">ยังไม่ได้รับ</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{unassignedLeads.toLocaleString()}</div>
            <p className="text-xs text-orange-700">รอการมอบหมาย</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">อัตราการรับ</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{assignmentRate.toFixed(1)}%</div>
            <p className="text-xs text-purple-700">ประสิทธิภาพการรับลีด</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - 4 Pie Charts in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1">
        {/* Assignment Status Pie Chart */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg font-semibold">สถานะการรับลีด</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {totalLeads} ลีด
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: function(params: any) {
                    const data = params.data;
                    return `
                      <div style="padding: 8px;">
                        <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${data.name}</div>
                        <div style="color: #6B7280; font-size: 12px;">จำนวน: ${data.value}</div>
                        <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${data.percentage.toFixed(1)}%</div>
                      </div>
                    `;
                  }
                },
                series: [
                  {
                    name: 'สถานะการรับลีด',
                    type: 'pie',
                    radius: ['45%', '75%'], // Changed to doughnut chart
                    center: ['50%', '50%'],
                    data: assignmentPieChartData.map(item => ({
                      name: item.name,
                      value: item.value,
                      percentage: item.percentage,
                      itemStyle: {
                        color: item.color
                      }
                    })),
                    label: {
                      show: true,
                      formatter: function(params: any) {
                        return `${params.name}\n${params.value} | ${params.data.percentage.toFixed(1)}%`;
                      },
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#374151'
                    },
                    labelLine: {
                      show: true,
                      length: 10,
                      length2: 10
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    },
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }
                ]
              }}
              style={{ height: '250px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </CardContent>
        </Card>

        {/* Platform Pie Chart */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold">แพลตฟอร์ม</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {platformStats.length} แพลตฟอร์ม
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: function(params: any) {
                    const data = params.data;
                    return `
                      <div style="padding: 8px;">
                        <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${data.name}</div>
                        <div style="color: #6B7280; font-size: 12px;">ทั้งหมด: ${data.value}</div>
                        <div style="color: #10B981; font-size: 12px;">รับแล้ว: ${data.assigned}</div>
                        <div style="color: #F59E0B; font-size: 12px;">ยังไม่ได้รับ: ${data.unassigned}</div>
                        <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${data.percentage.toFixed(1)}%</div>
                      </div>
                    `;
                  }
                },
                series: [
                  {
                    name: 'แพลตฟอร์ม',
                    type: 'pie',
                    radius: ['45%', '75%'], // Changed to doughnut chart
                    center: ['50%', '50%'],
                    data: platformPieChartData.map(item => ({
                      name: item.name,
                      value: item.value,
                      assigned: item.assigned,
                      unassigned: item.unassigned,
                      percentage: item.percentage,
                      itemStyle: {
                        color: item.color
                      }
                    })),
                    label: {
                      show: true,
                      formatter: function(params: any) {
                        return `${params.name}\n${params.value} | ${params.data.percentage.toFixed(1)}%`;
                      },
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#374151'
                    },
                    labelLine: {
                      show: true,
                      length: 10,
                      length2: 10
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    },
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }
                ]
              }}
              style={{ height: '250px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg font-semibold">ประเภทการขาย</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {categoryStats.length} ประเภทการขาย
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: function(params: any) {
                    const data = params.data;
                    return `
                      <div style="padding: 8px;">
                        <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${data.name}</div>
                        <div style="color: #6B7280; font-size: 12px;">ทั้งหมด: ${data.value}</div>
                        <div style="color: #10B981; font-size: 12px;">รับแล้ว: ${data.assigned}</div>
                        <div style="color: #F59E0B; font-size: 12px;">ยังไม่ได้รับ: ${data.unassigned}</div>
                        <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${data.percentage.toFixed(1)}%</div>
                      </div>
                    `;
                  }
                },
                series: [
                  {
                    name: 'ประเภทการขาย',
                    type: 'pie',
                    radius: ['45%', '75%'], // Changed to doughnut chart
                    center: ['50%', '50%'],
                    data: categoryPieChartData.map(item => ({
                      name: item.name,
                      value: item.value,
                      assigned: item.assigned,
                      unassigned: item.unassigned,
                      percentage: item.percentage,
                      itemStyle: {
                        color: item.color
                      }
                    })),
                    label: {
                      show: true,
                      formatter: function(params: any) {
                        return `${params.name}\n${params.value} | ${params.data.percentage.toFixed(1)}%`;
                      },
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#374151'
                    },
                    labelLine: {
                      show: true,
                      length: 10,
                      length2: 10
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    },
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }
                ]
              }}
              style={{ height: '250px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </CardContent>
        </Card>

        {/* Region Pie Chart */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg font-semibold">จังหวัด</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {regionStats.length} จังหวัด
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: function(params: any) {
                    const data = params.data;
                    return `
                      <div style="padding: 8px;">
                        <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${data.name}</div>
                        <div style="color: #6B7280; font-size: 12px;">ทั้งหมด: ${data.value}</div>
                        <div style="color: #10B981; font-size: 12px;">รับแล้ว: ${data.assigned}</div>
                        <div style="color: #F59E0B; font-size: 12px;">ยังไม่ได้รับ: ${data.unassigned}</div>
                        <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${data.percentage.toFixed(1)}%</div>
                      </div>
                    `;
                  }
                },
                series: [
                  {
                    name: 'จังหวัด',
                    type: 'pie',
                    radius: ['45%', '75%'], // Changed to doughnut chart
                    center: ['50%', '50%'],
                    data: regionPieChartData.map(item => ({
                      name: item.name,
                      value: item.value,
                      assigned: item.assigned,
                      unassigned: item.unassigned,
                      percentage: item.percentage,
                      itemStyle: {
                        color: item.color
                      }
                    })),
                    label: {
                      show: true,
                      formatter: function(params: any) {
                        return `${params.name}\n${params.value} | ${params.data.percentage.toFixed(1)}%`;
                      },
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#374151'
                    },
                    labelLine: {
                      show: true,
                      length: 10,
                      length2: 10
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    },
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }
                ]
              }}
              style={{ height: '250px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadsSummaryCards; 