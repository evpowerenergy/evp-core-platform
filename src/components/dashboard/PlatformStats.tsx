import { Card, CardContent } from "@/components/ui/card"; 
import { PLATFORM_OPTIONS, getPlatformIcon } from "@/utils/dashboardUtils";

interface PlatformStatsProps {
  [key: string]: number;
}

const PlatformStats = (props: PlatformStatsProps) => {
  const platformColors = {
    'Facebook': 'border-blue-200 text-blue-600',
    'Line': 'border-green-200 text-green-600', 
    'Huawei': 'border-red-200 text-red-600',
    'Huawei (C&I)': 'border-red-300 text-red-700',
    'Website': 'border-purple-200 text-purple-600',
    'TikTok': 'border-gray-200 text-gray-900',
    'IG': 'border-pink-200 text-pink-600',
    'YouTube': 'border-red-200 text-red-600',
    'Shopee': 'border-orange-200 text-orange-600',
    'Lazada': 'border-blue-200 text-blue-600',
    'แนะนำ': 'border-green-200 text-green-600',
    'Outbound': 'border-indigo-200 text-indigo-600',
    'โทร': 'border-gray-200 text-gray-600',
    'ลูกค้าเก่า service ครบ': 'border-amber-200 text-amber-600', // ✅ เพิ่มสีสำหรับ "ลูกค้าเก่า service ครบ"
    'ATMOCE': 'border-cyan-200 text-cyan-600',
    'Solar Edge': 'border-yellow-200 text-yellow-600',
    'Sigenergy': 'border-purple-200 text-purple-600',
    'solvana': 'border-emerald-200 text-emerald-600',
    'terawatt': 'border-teal-200 text-teal-600'
  };

  return ( 
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"> 
      {PLATFORM_OPTIONS.map((platform) => {
        // Create key that matches the props from AllLeadsReport
        let key = '';
        if (platform === 'Solar Edge') {
          key = 'solarEdgeLeads';
        } else if (platform === 'Huawei (C&I)') {
          key = 'huaweiCILeads';
        } else if (platform === 'Sigenergy') {
          key = 'sigenergyLeads';
        } else if (platform === 'แนะนำ') {
          key = 'แนะนำLeads';
        } else if (platform === 'โทร') {
          key = 'โทรLeads';
        } else if (platform === 'ลูกค้าเก่า service ครบ') {
          key = 'ลูกค้าเก่า service ครบLeads'; // ✅ เพิ่ม key สำหรับ "ลูกค้าเก่า service ครบ"
        } else {
          key = platform.toLowerCase() + 'Leads';
        }
        
        const leadCount = props[key] || 0;
        const colorClass = platformColors[platform as keyof typeof platformColors] || 'border-gray-200 text-gray-600';
        
        return (
          <Card key={platform} className={`hover:shadow-md transition-shadow ${colorClass.split(' ')[0]}`}> 
            <CardContent className="p-4"> 
              <div className="flex items-center justify-center gap-2"> 
                <div className="flex-shrink-0"> 
                  {getPlatformIcon(platform)}
                </div> 
                <div className="flex flex-col"> 
                  <div className={`text-xl font-bold ${colorClass.split(' ')[1]}`}>{leadCount}</div> 
                  <p className="text-xs text-gray-600">{platform}</p> 
                </div> 
              </div> 
            </CardContent> 
          </Card>
        );
      })}
    </div> 
  ); 
}; 
 
export default PlatformStats;
