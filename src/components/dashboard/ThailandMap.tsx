import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import * as echarts from 'echarts';

interface ThailandMapProps {
  regionData: { [key: string]: number };
  onRegionClick?: (region: string) => void;
  disableZoom?: boolean; // เพิ่ม prop สำหรับปิดการ zoom
}

const ThailandMap = ({ regionData, onRegionClick, disableZoom = false }: ThailandMapProps) => {
  const [mapData, setMapData] = useState<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // โหลด GeoJSON และลงทะเบียนแผนที่
    const loadMap = async () => {
      try {
        const response = await fetch('/thailand-complete.json');
        const thailandGeoJSON = await response.json();
        
        // ลงทะเบียนแผนที่ประเทศไทย
        echarts.registerMap('thailand', thailandGeoJSON);
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load Thailand map:', error);
        // ใช้แผนที่แบบง่ายถ้าโหลด GeoJSON ไม่สำเร็จ
        setMapLoaded(true);
      }
    };

    loadMap();
  }, []);

  useEffect(() => {
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ ECharts ต้องการ
    const data = Object.entries(regionData).map(([name, value]) => ({
      name,
      value
    }));
    setMapData(data);
  }, [regionData]);

  const getOption = () => {
    if (!mapLoaded) {
      return {
        title: {
          text: 'กำลังโหลดแผนที่...',
          left: 'center',
          top: 'center'
        }
      };
    }

    return {
      title: {
        text: '',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ef4444', // สีแดงสำหรับ tooltip
        borderColor: '#dc2626', // สีขอบแดงเข้ม
        borderWidth: 1,
        textStyle: {
          color: '#ffffff'
        },
        formatter: function(params: any) {
          const value = params.value || 0;
          const maxValue = 500; // ใช้ max 500 สำหรับการคำนวณ percentage
          const percentage = ((value / maxValue) * 100).toFixed(1);
          
          // กำหนดช่วงข้อมูลสำหรับ 0-500 (เขียวไปแดง)
          let range = '';
          if (value === 0) range = 'ไม่มีข้อมูล (0)';
          else if (value <= 50) range = 'น้อย (1-50)';
          else if (value <= 100) range = 'ปานกลาง (51-100)';
          else if (value <= 150) range = 'ค่อนข้างมาก (101-150)';
          else if (value <= 200) range = 'มาก (151-200)';
          else if (value <= 250) range = 'มากมาก (201-250)';
          else if (value <= 300) range = 'เยอะ (251-300)';
          else if (value <= 350) range = 'เยอะมาก (301-350)';
          else if (value <= 400) range = 'เยอะมากมาก (351-400)';
          else if (value <= 450) range = 'เยอะมากมากมาก (401-450)';
          else range = 'เยอะมากมากมากมาก (451-500)';
          
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; color: #ffffff; margin-bottom: 4px;">${params.name}</div>
            <div style="color: #fef3c7; font-size: 12px;">จำนวน: ${value.toLocaleString()} ลีด</div>
            <div style="color: #fde68a; font-size: 11px;">สัดส่วน: ${percentage}%</div>
            <div style="color: #fbbf24; font-size: 10px;">ระดับ: ${range}</div>
          </div>`;
        }
      },
      visualMap: {
        min: 0,
        max: 500, // จำกัดสูงสุดที่ 500
        left: 'left',
        top: 'bottom',
        text: ['สูง (500)', 'ต่ำ (0)'],
        calculable: true,
        // ใช้การแบ่งช่วงแบบ linear scale สำหรับข้อมูล 0-500 (เขียวไปแดง)
        pieces: [
          { min: 0, max: 0, color: '#f8fafc' },           // 0 - เทาอ่อนมาก (ไม่มีข้อมูล)
          { min: 1, max: 50, color: '#dcfce7' },          // 1-50 - เขียวอ่อนมาก
          { min: 51, max: 100, color: '#bbf7d0' },        // 51-100 - เขียวอ่อน
          { min: 101, max: 150, color: '#86efac' },       // 101-150 - เขียวปานกลาง
          { min: 151, max: 200, color: '#4ade80' },       // 151-200 - เขียวเข้มปานกลาง
          { min: 201, max: 250, color: '#22c55e' },       // 201-250 - เขียวเข้ม
          { min: 251, max: 300, color: '#16a34a' },       // 251-300 - เขียวเข้มมาก
          { min: 301, max: 350, color: '#15803d' },       // 301-350 - เขียวเข้มมากมาก
          { min: 351, max: 400, color: '#fef2f2' },       // 351-400 - แดงอ่อนมาก
          { min: 401, max: 450, color: '#fecaca' },       // 401-450 - แดงอ่อน
          { min: 451, max: 500, color: '#ef4444' }        // 451-500 - แดงเข้ม
        ],
        textStyle: {
          fontSize: 12,
          color: '#374151'
        },
        itemWidth: 20,
        itemHeight: 120
      },
      series: [
        {
          name: 'ประเทศไทย',
          type: 'map',
          map: 'thailand',
          roam: !disableZoom, // ถ้า disableZoom = true จะปิดการ zoom/pan
          zoom: 1.2,
          center: [101, 13],
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              color: '#ffffff'
            },
            itemStyle: {
              areaColor: '#ef4444', // สีแดงเมื่อ hover
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowBlur: 20,
              borderWidth: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            borderColor: '#16a34a', // สีขอบเขียว
            borderWidth: 1,
            areaColor: '#dcfce7' // สีพื้นหลังเริ่มต้นเขียวอ่อน
          },
          data: mapData,
          nameProperty: 'name',
          select: {
            disabled: true
          }
        }
      ]
    };
  };

  const onChartClick = (params: any) => {
    if (onRegionClick && params.name) {
      onRegionClick(params.name);
    }
  };

  const onEvents = {
    click: onChartClick
  };

  return (
    <Card className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MapPin className="h-5 w-5 text-green-700" />
          แผนที่ประเทศไทย - ข้อมูลตามจังหวัด
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[500px]">
          <ReactECharts
            option={getOption()}
            style={{ height: '100%', width: '100%' }}
            onEvents={onEvents}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ThailandMap; 