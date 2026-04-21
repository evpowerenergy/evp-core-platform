import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Award } from "lucide-react";
import { SalesTeamMember } from "@/types/salesTeam";

interface TeamOverviewCardsProps {
  salesTeam: SalesTeamMember[];
  currentLeadsCount: number;
}

const TeamOverviewCards = ({ salesTeam, currentLeadsCount }: TeamOverviewCardsProps) => {
  const totalMembers = salesTeam.length;
  const activeMembers = salesTeam.filter(member => member.status === 'active').length;
  const totalDealsThisMonth = salesTeam.reduce((sum, member) => sum + (member.deals_closed || 0), 0);
  const totalSalesAmount = salesTeam.reduce((sum, member) => sum + (member.pipeline_value || 0), 0);
  
  // Calculate team conversion rate from total team data (not average of individual rates)
  const totalTeamLeads = salesTeam.reduce((sum, member) => {
    return sum + (member.total_leads || 0);
  }, 0);
  const teamConversionRate = totalTeamLeads > 0 ? (totalDealsThisMonth / totalTeamLeads) * 100 : 0;

  // Ensure all values are valid numbers
  const safeTotalMembers = isNaN(totalMembers) ? 0 : totalMembers;
  const safeActiveMembers = isNaN(activeMembers) ? 0 : activeMembers;
  const safeTotalDealsThisMonth = isNaN(totalDealsThisMonth) ? 0 : totalDealsThisMonth;
  const safeTotalSalesAmount = isNaN(totalSalesAmount) ? 0 : totalSalesAmount;
  const safeTeamConversionRate = isNaN(teamConversionRate) ? 0 : teamConversionRate;

  const cards = [
    {
      title: "สมาชิกทีม",
      value: safeTotalMembers,
      subtitle: `ใช้งาน: ${safeActiveMembers} คน`,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
      textColor: "text-blue-900"
    },
    {
      title: "ดีลที่ปิดสำเร็จ",
      value: safeTotalDealsThisMonth,
      subtitle: "ทั้งหมด",
      icon: Award,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-100",
      iconBg: "bg-green-500",
      textColor: "text-green-900"
    },
    {
      title: "อัตราการปิดการขาย",
      value: `${Math.round(safeTeamConversionRate * 100) / 100}%`,
      subtitle: "ของทีม",
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
      textColor: "text-purple-900"
    },
    {
      title: "ยอดขาย",
      value: `฿${(safeTotalSalesAmount / 1000000).toFixed(1)}M`,
      subtitle: "รวมทั้งหมด",
      icon: DollarSign,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-100",
      iconBg: "bg-orange-500",
      textColor: "text-orange-900"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card 
          key={card.title}
          className={`bg-gradient-to-br ${card.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className={`text-sm font-semibold ${card.textColor}`}>{card.title}</CardTitle>
            <div className={`p-3 ${card.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-5xl font-bold ${card.textColor} mb-1`}>
              {card.value}
            </div>
            <p className={`text-sm ${card.textColor} opacity-80 font-medium`}>
              {card.subtitle}
            </p>
          </CardContent>
          <div className={`absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl ${card.gradient} opacity-10 rounded-full -mr-10 -mb-10`}></div>
        </Card>
      ))}
    </div>
  );
};

export default TeamOverviewCards;
