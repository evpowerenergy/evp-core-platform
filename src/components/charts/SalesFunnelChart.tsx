import React, { Suspense } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface SalesFunnelChartProps {
  stage1Data: {
    totalLeads: number;
    platformBreakdown: { [key: string]: number };
  };
  stage2Data: {
    totalQuotations: number;
    totalValue: number;
    platformBreakdown: { [key: string]: number };
  };
  stage3Data: {
    totalClosedQuotations: number;
    totalClosedValue: number;
    platformBreakdown: { [key: string]: number };
  };
}

// สี palette สำหรับแต่ละ platform
const platformColors: { [key: string]: string } = {
  'Facebook': '#1877F2',
  'Line': '#06C755',
  'Instagram': '#E4405F',
  'Walk-in': '#8B5CF6',
  'Website': '#3B82F6',
  'โทรเข้า': '#F59E0B',
  'ไม่ระบุ': '#9CA3AF'
};

const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({
  stage1Data,
  stage2Data,
  stage3Data
}) => {
  const getConversionRate = (current: number, previous: number): number => {
    return previous > 0 ? (current / previous) * 100 : 0;
  };

  const stage1ToStage2Rate = getConversionRate(stage2Data.totalQuotations, stage1Data.totalLeads);
  const stage2ToStage3Rate = getConversionRate(stage3Data.totalClosedQuotations, stage2Data.totalQuotations);

  // ใช้ค่าคงที่สำหรับรูปร่าง funnel (100, 70, 40) เพื่อให้รูปทรงสวยงาม
  // ปรับสีให้สวยงามเหมือนในรูป (ม่วง, ชมพู, ฟ้า, ฟ้าอ่อน)
  const funnelData = [
    {
      name: 'ลีดที่เซลล์รับแล้ว',
      value: 100, // ค่าคงที่สำหรับรูปร่าง
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#9333EA' }, // สีม่วงเข้ม
            { offset: 1, color: '#7C3AED' }  // สีม่วงอ่อน
          ]
        },
        shadowBlur: 10,
        shadowColor: 'rgba(147, 51, 234, 0.3)',
        shadowOffsetY: 4
      }
    },
    {
      name: 'QT ทั้งหมด',
      value: 70, // ค่าคงที่สำหรับรูปร่าง
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#EC4899' }, // สีชมพูเข้ม
            { offset: 1, color: '#F472B6' }  // สีชมพูอ่อน
          ]
        },
        shadowBlur: 10,
        shadowColor: 'rgba(236, 72, 153, 0.3)',
        shadowOffsetY: 4
      }
    },
    {
      name: 'QT ที่ปิดการขาย',
      value: 40, // ค่าคงที่สำหรับรูปร่าง
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#06B6D4' }, // สีฟ้าเข้ม
            { offset: 1, color: '#22D3EE' }  // สีฟ้าอ่อน
          ]
        },
        shadowBlur: 10,
        shadowColor: 'rgba(6, 182, 212, 0.3)',
        shadowOffsetY: 4
      }
    }
  ];

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: {
      show: false // ซ่อน title เพื่อให้ดูสะอาดขึ้น
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        // หาข้อมูลจริง
        let actualValue = 0;
        let percentage = 0;
        let platformBreakdown = {};
        let totalValue = 0;
        
        if (params.name === 'ลีดที่เซลล์รับแล้ว') {
          actualValue = stage1Data.totalLeads;
          percentage = 100;
          platformBreakdown = stage1Data.platformBreakdown;
        } else if (params.name === 'QT ทั้งหมด') {
          actualValue = stage2Data.totalQuotations;
          percentage = ((stage2Data.totalQuotations / stage1Data.totalLeads) * 100);
          platformBreakdown = stage2Data.platformBreakdown;
          totalValue = stage2Data.totalValue;
        } else if (params.name === 'QT ที่ปิดการขาย') {
          actualValue = stage3Data.totalClosedQuotations;
          percentage = ((stage3Data.totalClosedQuotations / stage1Data.totalLeads) * 100);
          platformBreakdown = stage3Data.platformBreakdown;
          totalValue = stage3Data.totalClosedValue;
        }
        
        let conversionText = '';
        if (params.name === 'QT ทั้งหมด') {
          conversionText = `<div style="color: #F59E0B; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">อัตราการแปลง: ${stage1ToStage2Rate.toFixed(1)}%</div>`;
        } else if (params.name === 'QT ที่ปิดการขาย') {
          conversionText = `<div style="color: #10B981; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">อัตราการปิด: ${stage2ToStage3Rate.toFixed(1)}%</div>`;
        }

        let valueText = '';
        if (totalValue > 0) {
          valueText = `<div style="color: #6B7280; font-size: 13px; margin-top: 4px;">มูลค่า: ฿${totalValue.toLocaleString()}</div>`;
        }

        // ไม่แสดง Platform breakdown ใน tooltip
        let platformText = '';
        
        return `
          <div style="padding: 16px; min-width: 300px;">
            <div style="font-weight: bold; color: #374151; font-size: 16px; margin-bottom: 12px;">
              ${params.name}
            </div>
            <div style="color: ${params.color}; font-size: 24px; font-weight: bold; margin-bottom: 6px;">
              ${actualValue.toLocaleString()}
            </div>
            <div style="color: #6B7280; font-size: 13px;">
              ${percentage.toFixed(1)}% ของลีดทั้งหมด
            </div>
            ${valueText}
            ${platformText}
            ${conversionText}
          </div>
        `;
      }
    },
    series: [
      {
        name: 'Sales Funnel',
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: '5%',
        bottom: '8%',
        width: '84%',
        min: 0,
        max: 100,
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 8, // เพิ่ม gap ให้ดูสวยงามขึ้น
        label: {
          show: true,
          position: 'inside',
          formatter: function(params: any) {
            // แสดงข้อมูลจริง ไม่ใช่ค่าคงที่ที่ใช้สำหรับรูปร่าง
            let actualValue = 0;
            let percentage = 0;
            let stageNumber = '';
            
            if (params.name === 'ลีดที่เซลล์รับแล้ว') {
              actualValue = stage1Data.totalLeads;
              percentage = 100;
              stageNumber = '01';
            } else if (params.name === 'QT ทั้งหมด') {
              actualValue = stage2Data.totalQuotations;
              percentage = ((stage2Data.totalQuotations / stage1Data.totalLeads) * 100);
              stageNumber = '02';
            } else if (params.name === 'QT ที่ปิดการขาย') {
              actualValue = stage3Data.totalClosedQuotations;
              percentage = ((stage3Data.totalClosedQuotations / stage1Data.totalLeads) * 100);
              stageNumber = '03';
            }

            // แสดง stage number ด้านซ้าย และข้อมูลด้านขวา
            return `{stage|Stage ${stageNumber}}\n{name|${params.name}}\n{value|${actualValue.toLocaleString()}}\n{percent|${percentage.toFixed(1)}%}`;
          },
          rich: {
            stage: {
              fontSize: 18,
              fontWeight: 'bold',
              color: '#FFFFFF',
              lineHeight: 28,
              padding: [0, 0, 8, 0]
            },
            name: {
              fontSize: 16,
              fontWeight: 'bold',
              color: '#FFFFFF',
              lineHeight: 24
            },
            value: {
              fontSize: 28,
              fontWeight: 'bold',
              color: '#FFFFFF',
              lineHeight: 36,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowBlur: 4,
              textShadowOffsetX: 0,
              textShadowOffsetY: 2
            },
            percent: {
              fontSize: 14,
              color: '#FFFFFF',
              lineHeight: 20,
              opacity: 0.9
            }
          }
        },
        labelLine: {
          show: false
        },
        itemStyle: {
          borderColor: '#FFFFFF',
          borderWidth: 4,
          borderRadius: [8, 8, 8, 8] // เพิ่ม border radius ให้ดูนุ่มนวลขึ้น
        },
        emphasis: {
          label: {
            fontSize: 20,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 30,
            shadowOffsetX: 0,
            shadowOffsetY: 8,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 5
          }
        },
        data: funnelData
      }
    ]
  };

  return (
    <Suspense fallback={<div className="h-[500px] flex items-center justify-center">กำลังโหลด...</div>}>
      <ReactECharts 
        option={option} 
        style={{ height: '100%', minHeight: '500px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </Suspense>
  );
};

export default SalesFunnelChart;