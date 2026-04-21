import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Users, UserCheck, Percent, DollarSign, RefreshCw } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { ElectricityLoadingMedium } from '@/components/ui/loading';
import { useChatBotPerformance } from '@/hooks/useChatBotPerformance';
import { useOpenAICost, useSyncOpenAICost } from '@/hooks/useOpenAICost';
import ReactECharts from 'echarts-for-react';
import { toast } from 'sonner';

export default function ChatBotPerformancePage() {
  // ตั้งค่า date range default เป็น 30 วันย้อนหลัง
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: thirtyDaysAgo, 
    to: today 
  });

  const { data, isLoading, error } = useChatBotPerformance(dateRangeFilter);
  const { data: openAICostDataRaw, isLoading: isLoadingCost, error: costError } = useOpenAICost(dateRangeFilter);
  const { mutate: syncData, isPending: isSyncing } = useSyncOpenAICost();
  
  // Type guard เพื่อความปลอดภัย
  const chartData = data || [];
  const openAICostData = openAICostDataRaw || [];

  // Handle sync button click
  const handleSync = () => {
    const fromDate = dateRangeFilter?.from || thirtyDaysAgo;
    const toDate = dateRangeFilter?.to || today;
    
    const startDate = fromDate.toISOString().split('T')[0];
    const endDate = toDate.toISOString().split('T')[0];
    
    toast.info(`🔄 กำลัง Sync ข้อมูล ${startDate} ถึง ${endDate}...`);
    
    syncData(
      { startDate, endDate },
      {
        onSuccess: (data: any) => {
          toast.success(`✅ Sync สำเร็จ! อัพเดท ${data.data?.recordsSynced || 0} วัน`);
        },
        onError: (error: any) => {
          toast.error(`❌ Sync ล้มเหลว: ${error.message}`);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ElectricityLoadingMedium />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6 border-red-200">
          <p className="text-red-600">เกิดข้อผิดพลาด: {error.message}</p>
        </Card>
      </div>
    );
  }

  // คำนวณสถิติรวม
  const totalStats = chartData.reduce((acc, item) => ({
    totalUsers: acc.totalUsers + item.totalUsers,
    leadsWithContact: acc.leadsWithContact + item.leadsWithContact,
  }), { totalUsers: 0, leadsWithContact: 0 });

  const overallConversionRate = totalStats.totalUsers > 0 
    ? Math.round((totalStats.leadsWithContact / totalStats.totalUsers) * 100) 
    : 0;

  // คำนวณค่าใช้จ่ายรวมจากข้อมูลจริงของ OpenAI
  const totalCost = openAICostData.reduce((sum, item) => sum + item.cost, 0);
  /** บางช่วงใช้ประมาณจาก token (เมื่อ Costs API = $0) */
  const hasTokenEstimateCost = openAICostData.some((d) => d.syncSource === 'usage_completions_api');

  // เตรียมข้อมูลสำหรับกราฟ Stacked Bar Chart
  const chartOption = {
    title: {
      text: 'ผลการทำงานของ Chatbot',
      subtext: 'เปรียบเทียบผู้ใช้ทั้งหมดกับลีดที่มีข้อมูลติดต่อ',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F1F5F9'  // สีอ่อนขึ้น
      },
      subtextStyle: {
        fontSize: 14,
        color: '#94A3B8'  // สีอ่อนขึ้น
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `<div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${params[0].axisValue}</div>`;
        
        // ✅ แก้ไข: params[0] = leadsWithContact (สีเขียว), params[1] = usersWithoutContact (สีม่วง)
        const leadsWithContact = params[0]?.value || 0;
        const usersWithoutContact = params[1]?.value || 0;
        const totalUsers = leadsWithContact + usersWithoutContact;
        
        result += `
          <div style="margin: 8px 0; padding: 8px 0; border-top: 1px solid #E5E7EB;">
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #64748B;"></span>
              <span>ผู้ติดต่อทั้งหมด: <strong>${totalUsers}</strong> คน</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #10B981;"></span>
              <span>มีข้อมูลติดต่อ: <strong>${leadsWithContact}</strong> คน 
                ${totalUsers > 0 ? `(<strong>${Math.round((leadsWithContact / totalUsers) * 100)}%</strong>)` : ''}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #A78BFA;"></span>
              <span>ไม่มีข้อมูลติดต่อ: <strong>${usersWithoutContact}</strong> คน 
                ${totalUsers > 0 ? `(<strong>${Math.round((usersWithoutContact / totalUsers) * 100)}%</strong>)` : ''}
              </span>
            </div>
          </div>
        `;
        return result;
      }
    },
    legend: {
      data: ['ผู้ติดต่อที่มีข้อมูล', 'ผู้ติดต่อที่ไม่มีข้อมูล'],
      bottom: 20,
      itemGap: 30,
      textStyle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#E2E8F0'  // สีอ่อนขึ้น
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.displayDate),
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#CBD5E1',  // สีอ่อนขึ้น
        rotate: chartData.length > 10 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: 'จำนวนผู้ติดต่อ (คน)',
      nameTextStyle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#E2E8F0',  // สีอ่อนขึ้น
        padding: [0, 0, 0, 0]
      },
      axisLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#CBD5E1'  // สีอ่อนขึ้น
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#334155'  // สีเข้มขึ้นเพื่อให้เห็นชัดในพื้นหลังมืด
        }
      }
    },
    series: [
      {
        name: 'ผู้ติดต่อที่มีข้อมูล',
        type: 'bar',
        stack: 'total',
        data: chartData.map(item => item.leadsWithContact),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#10B981' },
              { offset: 1, color: '#059669' }
            ]
          },
          borderRadius: [0, 0, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#059669' },
                { offset: 1, color: '#047857' }
              ]
            },
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(16, 185, 129, 0.5)'
          }
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => params.value > 0 ? params.value : '',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff'
        }
      },
      {
        name: 'ผู้ติดต่อที่ไม่มีข้อมูล',
        type: 'bar',
        stack: 'total',
        data: chartData.map(item => item.totalUsers - item.leadsWithContact),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#A78BFA' },
              { offset: 1, color: '#7C3AED' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#8B5CF6' },
                { offset: 1, color: '#6D28D9' }
              ]
            },
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(124, 58, 237, 0.5)'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            // แสดงจำนวนผู้ติดต่อทั้งหมดและ winrate แยกคนละบรรทัด
            const totalUsers = chartData[params.dataIndex]?.totalUsers || 0;
            const leadsWithContact = chartData[params.dataIndex]?.leadsWithContact || 0;
            const winrate = totalUsers > 0 ? Math.round((leadsWithContact / totalUsers) * 100) : 0;
            
            return totalUsers > 0 ? `Total: ${totalUsers}\nWinrate: ${winrate}%` : '';
          },
          fontSize: 11,
          fontWeight: 'bold',
          color: '#F1F5F9',  // สีอ่อนขึ้น
          lineHeight: 14
        }
      }
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-indigo-800/50 shadow-lg flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Performance Analytics
              </h1>
            </div> */}
            
            {/* Statistics Cards - Center */}
            <div className="flex items-center gap-4">
              {/* Total Users Card - Enhanced */}
              <div className="relative bg-gradient-to-br from-purple-600/30 to-purple-700/30 px-5 py-3 rounded-xl border-2 border-purple-500/60 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <Users className="h-7 w-7 text-purple-300" />
                  <div className="flex flex-col">
                    <span className="text-xs text-purple-300 font-semibold uppercase tracking-wide">ผู้ใช้ทั้งหมด</span>
                    <span className="text-3xl font-black text-purple-50 tracking-tight leading-none mt-1">{totalStats.totalUsers.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Leads with Contact Card - Enhanced */}
              <div className="relative bg-gradient-to-br from-emerald-600/30 to-emerald-700/30 px-5 py-3 rounded-xl border-2 border-emerald-500/60 shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <UserCheck className="h-7 w-7 text-emerald-300" />
                  <div className="flex flex-col">
                    <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wide">ลีดมีข้อมูล</span>
                    <span className="text-3xl font-black text-emerald-50 tracking-tight leading-none mt-1">{totalStats.leadsWithContact.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* OpenAI Cost Card - Enhanced */}
              <div className="relative bg-gradient-to-br from-amber-600/30 to-orange-700/30 px-5 py-3 rounded-xl border-2 border-amber-500/60 shadow-lg hover:shadow-amber-500/30 transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <DollarSign className="h-7 w-7 text-amber-300" />
                  <div className="flex flex-col">
                    <span className="text-xs text-amber-300 font-semibold uppercase tracking-wide">ค่าใช้จ่ายรวม</span>
                    <span className="text-3xl font-black text-amber-50 tracking-tight leading-none mt-1">฿{totalCost.toFixed(2)}</span>
                    {hasTokenEstimateCost && (
                      <span className="text-[10px] text-amber-200/80 mt-0.5 max-w-[14rem] leading-tight">
                        *บางวันเป็นประมาณการจาก token (Costs API ได้ $0) — ปรับได้ที่ OPENAI_USAGE_ESTIMATE_USD_PER_MTOK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Per Lead Card - Enhanced */}
              <div className="relative bg-gradient-to-br from-orange-600/30 to-red-700/30 px-5 py-3 rounded-xl border-2 border-orange-500/60 shadow-lg hover:shadow-orange-500/30 transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <Percent className="h-7 w-7 text-orange-300" />
                  <div className="flex flex-col">
                    <span className="text-xs text-orange-300 font-semibold uppercase tracking-wide">ค่าใช้จ่ายต่อลีด</span>
                    <span className="text-3xl font-black text-orange-50 tracking-tight leading-none mt-1">
                      ฿{totalStats.leadsWithContact > 0 ? (totalCost / totalStats.leadsWithContact).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-3">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-indigo-700/50">
                <Calendar className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <DateRangePicker
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  placeholder="เลือกช่วงเวลา"
                  presets={true}
                  className="w-auto"
                />
              </div>

              {/* Sync OpenAI Data Button */}
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                size="sm"
                variant="outline"
                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 hover:text-amber-100"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'กำลัง Sync...' : 'Sync OpenAI'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-4 py-3">
        <div className="h-full max-w-[1800px] mx-auto flex flex-col gap-3">
          {/* Statistics and Gauge Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-shrink-0">
            {/* OpenAI Cost Line Chart */}
            <div className="h-full min-h-[250px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-indigo-700/50 relative overflow-hidden flex flex-col">
              
              {/* Background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
              
              {/* Header Section */}
              <div className="relative z-10 text-center py-2 px-2 flex-shrink-0">
                <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-400" />
                  OpenAI Cost
                </h3>
                {!costError && (
                  <p className="text-xs text-slate-400">
                    ค่าใช้จ่ายรวม: ฿{totalCost.toFixed(2)}
                    {hasTokenEstimateCost && ' (มีประมาณการจาก token)'}
                  </p>
                )}
              </div>
              
              {/* Chart Section */}
              <div className="flex-1 relative px-2 pb-2">
                {isLoadingCost ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/20 rounded-full mb-3">
                        <DollarSign className="h-6 w-6 text-amber-400 animate-pulse" />
                      </div>
                      <p className="text-sm text-amber-300">กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                ) : costError ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-3">
                        <DollarSign className="h-6 w-6 text-red-400" />
                      </div>
                      <p className="text-sm text-red-300 font-medium">ไม่สามารถโหลดข้อมูลได้</p>
                      <p className="text-xs text-red-400 mt-1">ตรวจสอบ API Key</p>
                    </div>
                  </div>
                ) : (
                <ReactECharts 
                  option={{
                    backgroundColor: 'transparent',
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: {
                        type: 'cross',
                        label: {
                          backgroundColor: '#F59E0B'
                        }
                      },
                      formatter: (params: any) => {
                        const dataIndex = params[0].dataIndex;
                        const item = openAICostData[dataIndex];
                        const cost = params[0].value;
                        
                        // Match date with chartData ด้วย ISO date key
                        const matchedData = chartData.find(d => d.date === item?.date);
                        const users = matchedData?.totalUsers || 0;
                        
                        return `
                          <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${item?.displayDate || item?.date}</div>
                          <div style="margin: 8px 0; padding: 8px 0; border-top: 1px solid #E5E7EB;">
                            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #F59E0B;"></span>
                              <span>ค่าใช้จ่าย: <strong>฿${cost.toFixed(2)}</strong></span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                              <span>ผู้ใช้: <strong>${users}</strong> คน</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                              <span>เฉลี่ย: <strong>฿${users > 0 ? (cost / users).toFixed(2) : '0.00'}</strong> / คน</span>
                            </div>
                          </div>
                        `;
                      }
                    },
                    grid: {
                      left: '12%',
                      right: '8%',
                      bottom: '15%',
                      top: '10%',
                      containLabel: false
                    },
                    xAxis: {
                      type: 'category',
                      data: openAICostData.map(item => item.displayDate || item.date),
                      boundaryGap: false,
                      axisLabel: {
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#CBD5E1',
                        rotate: openAICostData.length > 7 ? 35 : 0,
                        interval: openAICostData.length > 14 ? 'auto' : 0
                      },
                      axisLine: {
                        lineStyle: {
                          color: '#475569'
                        }
                      }
                    },
                    yAxis: {
                      type: 'value',
                      name: '฿',
                      nameTextStyle: {
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#E2E8F0',
                        padding: [0, 0, 0, 0]
                      },
                      axisLabel: {
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#CBD5E1',
                        formatter: '฿{value}'
                      },
                      splitLine: {
                        lineStyle: {
                          type: 'dashed',
                          color: '#334155'
                        }
                      },
                      axisLine: {
                        lineStyle: {
                          color: '#475569'
                        }
                      }
                    },
                    series: [
                      {
                        name: 'Cost',
                        type: 'line',
                        smooth: true,
                        data: openAICostData.map(item => item.cost),
                        symbol: 'circle',
                        symbolSize: 8,
                        itemStyle: {
                          color: '#F59E0B',
                          borderColor: '#fff',
                          borderWidth: 2
                        },
                        lineStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                              { offset: 0, color: '#F59E0B' },
                              { offset: 0.5, color: '#EF4444' },
                              { offset: 1, color: '#DC2626' }
                            ]
                          },
                          width: 3,
                          shadowColor: 'rgba(245, 158, 11, 0.5)',
                          shadowBlur: 10,
                          shadowOffsetY: 3
                        },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(245, 158, 11, 0.4)' },
                              { offset: 0.5, color: 'rgba(239, 68, 68, 0.2)' },
                              { offset: 1, color: 'rgba(220, 38, 38, 0.1)' }
                            ]
                          }
                        },
                        emphasis: {
                          focus: 'series',
                          itemStyle: {
                            color: '#FBBF24',
                            borderColor: '#fff',
                            borderWidth: 3,
                            shadowBlur: 15,
                            shadowColor: 'rgba(245, 158, 11, 0.8)'
                          }
                        },
                        label: {
                          show: openAICostData.length <= 10,
                          position: 'top',
                          formatter: (params: any) => params.value > 0 ? `฿${params.value.toFixed(0)}` : '',
                          fontSize: 9,
                          fontWeight: 'bold',
                          color: '#FCD34D'
                        }
                      }
                    ],
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
                )}
              </div>
            </div>

            {/* Neon Gauge Chart - ขยายขนาด */}
            <div className="h-full min-h-[250px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-indigo-700/50 relative overflow-hidden flex flex-col">
              
              {/* Neon glow background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-green-500/5 pointer-events-none"></div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              
              {/* Header Section */}
              <div className="relative z-10 text-center py-2 px-2 flex-shrink-0">
                <h3 className="text-xl font-semibold text-white">
                  Conversion Rate
                </h3>
              </div>
              
              {/* Chart Section */}
              <div className="flex-1 relative px-4 pb-2">
                <ReactECharts 
                option={{
                  backgroundColor: 'transparent',
                  series: [
                    {
                      name: 'Conversion Rate',
                      type: 'gauge',
                      startAngle: 180,
                      endAngle: 0,
                      center: ['50%', '85%'],
                      radius: '120%',
                      min: 0,
                      max: 100,
                      splitNumber: 4,
                      axisLine: {
                        lineStyle: {
                          width: 40,
                          color: [
                            [1, '#334155']  // หลอดเปล่าสีเทาเข้ม
                          ],
                          shadowColor: 'rgba(0, 0, 0, 0.5)',
                          shadowBlur: 10
                        }
                      },
                      progress: {
                        show: true,
                        width: 40,
                        itemStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                              { offset: 0, color: '#FF6B35' },   // ส้ม
                              { offset: 0.33, color: '#FFD23F' }, // เหลือง
                              { offset: 0.66, color: '#3B82F6' }, // ฟ้า
                              { offset: 1, color: '#10B981' }     // เขียว
                            ]
                          },
                          shadowColor: overallConversionRate <= 25 ? '#FF6B35' : 
                                      overallConversionRate <= 50 ? '#FFD23F' :
                                      overallConversionRate <= 75 ? '#3B82F6' : '#10B981',
                          shadowBlur: 30,
                          shadowOffsetX: 0,
                          shadowOffsetY: 0
                        }
                      },
                      pointer: {
                        show: false
                      },
                      axisTick: {
                        distance: -36,
                        length: 6,
                        lineStyle: {
                          color: '#475569',
                          width: 2
                        }
                      },
                      splitLine: {
                        distance: -1,
                        length: 10,
                        lineStyle: {
                          color: '#1E293B',
                          width: 3
                        }
                      },
                      axisLabel: {
                        distance: -40,
                        color: '#E2E8F0',
                        fontSize: 12,
                        fontWeight: 'bold',
                        formatter: function (value: number) {
                          return value.toString();
                        }
                      },
                      detail: {
                        valueAnimation: true,
                        formatter: function (value: number) {
                          return '{value|' + Math.round(value) + '}{unit| %}';
                        },
                        rich: {
                          value: {
                            fontSize: 50,
                            fontWeight: 'bold',
                            color: overallConversionRate <= 25 ? '#FF6B35' : 
                                   overallConversionRate <= 50 ? '#FFD23F' :
                                   overallConversionRate <= 75 ? '#3B82F6' : '#10B981',
                            textShadowColor: overallConversionRate <= 25 ? '#FF6B35' : 
                                            overallConversionRate <= 50 ? '#FFD23F' :
                                            overallConversionRate <= 75 ? '#3B82F6' : '#10B981',
                            textShadowBlur: 25,
                            textShadowOffsetX: 0,
                            textShadowOffsetY: 0
                          },
                          unit: {
                            fontSize: 32,
                            color: overallConversionRate <= 25 ? '#FF8E53' : 
                                   overallConversionRate <= 50 ? '#FFE066' :
                                   overallConversionRate <= 75 ? '#60A5FA' : '#34D399',
                            textShadowColor: overallConversionRate <= 25 ? '#FF6B35' : 
                                            overallConversionRate <= 50 ? '#FFD23F' :
                                            overallConversionRate <= 75 ? '#3B82F6' : '#10B981',
                            textShadowBlur: 18,
                            padding: [0, 0, 0, 2]
                          }
                        },
                        offsetCenter: [0, '0%']
                      },
                      title: {
                        show: false
                      },
                      data: [
                        {
                          value: overallConversionRate
                        }
                      ]
                    }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
              </div>
            </div>

            {/* Daily Winrate Line Chart */}
            <div className="h-full min-h-[250px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-indigo-700/50 relative overflow-hidden flex flex-col">
              
              {/* Background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
              
              {/* Header Section */}
              <div className="relative z-10 text-center py-2 px-2 flex-shrink-0">
                <h3 className="text-xl font-semibold text-white">
                  Daily Winrate
                </h3>
                {/* <p className="text-xs text-slate-400">อัตราการแปลงลีดรายวัน</p> */}
              </div>
              
              {/* Chart Section */}
              <div className="flex-1 relative px-2 pb-2">
                <ReactECharts 
                  option={{
                    backgroundColor: 'transparent',
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: {
                        type: 'cross',
                        label: {
                          backgroundColor: '#6366F1'
                        }
                      },
                      formatter: (params: any) => {
                        const dataIndex = params[0].dataIndex;
                        const date = chartData[dataIndex]?.displayDate;
                        const winrate = params[0].value;
                        const totalUsers = chartData[dataIndex]?.totalUsers || 0;
                        const leadsWithContact = chartData[dataIndex]?.leadsWithContact || 0;
                        
                        return `
                          <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${date}</div>
                          <div style="margin: 8px 0; padding: 8px 0; border-top: 1px solid #E5E7EB;">
                            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #3B82F6;"></span>
                              <span>Winrate: <strong>${winrate}%</strong></span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                              <span>ลีดมีข้อมูล: <strong>${leadsWithContact}</strong> / ${totalUsers} คน</span>
                            </div>
                          </div>
                        `;
                      }
                    },
                    grid: {
                      left: '12%',
                      right: '8%',
                      bottom: '15%',
                      top: '10%',
                      containLabel: false
                    },
                    xAxis: {
                      type: 'category',
                      data: chartData.map(item => item.displayDate),
                      boundaryGap: false,
                      axisLabel: {
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#CBD5E1',
                        rotate: chartData.length > 7 ? 35 : 0,
                        interval: chartData.length > 14 ? 'auto' : 0
                      },
                      axisLine: {
                        lineStyle: {
                          color: '#475569'
                        }
                      }
                    },
                    yAxis: {
                      type: 'value',
                      name: '%',
                      nameTextStyle: {
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#E2E8F0',
                        padding: [0, 0, 0, 0]
                      },
                      min: 0,
                      max: 100,
                      axisLabel: {
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#CBD5E1',
                        formatter: '{value}%'
                      },
                      splitLine: {
                        lineStyle: {
                          type: 'dashed',
                          color: '#334155'
                        }
                      },
                      axisLine: {
                        lineStyle: {
                          color: '#475569'
                        }
                      }
                    },
                    series: [
                      {
                        name: 'Winrate',
                        type: 'line',
                        smooth: true,
                        data: chartData.map(item => item.conversionRate),
                        symbol: 'circle',
                        symbolSize: 8,
                        itemStyle: {
                          color: '#3B82F6',
                          borderColor: '#fff',
                          borderWidth: 2
                        },
                        lineStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                              { offset: 0, color: '#3B82F6' },
                              { offset: 0.5, color: '#06B6D4' },
                              { offset: 1, color: '#10B981' }
                            ]
                          },
                          width: 3,
                          shadowColor: 'rgba(59, 130, 246, 0.5)',
                          shadowBlur: 10,
                          shadowOffsetY: 3
                        },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
                              { offset: 0.5, color: 'rgba(6, 182, 212, 0.2)' },
                              { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
                            ]
                          }
                        },
                        emphasis: {
                          focus: 'series',
                          itemStyle: {
                            color: '#60A5FA',
                            borderColor: '#fff',
                            borderWidth: 3,
                            shadowBlur: 15,
                            shadowColor: 'rgba(59, 130, 246, 0.8)'
                          }
                        },
                        label: {
                          show: chartData.length <= 10,
                          position: 'top',
                          formatter: (params: any) => params.value > 0 ? `${params.value}%` : '',
                          fontSize: 10,
                          fontWeight: 'bold',
                          color: '#E2E8F0'
                        }
                      }
                    ],
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>
          </div>

          {/* Chart - Full Width */}
          <Card className="shadow-2xl border border-indigo-700/50 bg-slate-900 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-indigo-800/50 bg-gradient-to-r from-slate-800/50 to-indigo-900/50 py-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-100">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    กราฟเปรียบเทียบผู้ติดต่อและลีด
                  </CardTitle>
                  {/* <p className="text-[10px] text-slate-400 mt-0.5">
                    แสดงจำนวนผู้ติดต่อทั้งหมดที่เข้ามาคุยกับ Chatbot เปรียบเทียบกับลีดที่มีข้อมูลติดต่อ (Stacked Bar Chart)
                  </p> */}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 bg-slate-900 flex-1 overflow-hidden">
              {chartData.length > 0 ? (
                <div className="h-full">
                  <ReactECharts
                    option={chartOption} 
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
                      <TrendingUp className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-lg font-medium text-slate-300">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                      ลองเลือกช่วงเวลาอื่น หรือตรวจสอบว่ามีผู้ใช้เข้ามาคุยกับ Chatbot หรือไม่
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

