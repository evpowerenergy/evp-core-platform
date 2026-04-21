import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, BotOff, TrendingUp } from 'lucide-react';

interface ChatBotStatsCardsProps {
  stats: {
    totalCustomers: number;
    activeBotsCount: number;
    inactiveBotsCount: number;
    activePercentage: number;
  };
}

export function ChatBotStatsCards({ stats }: ChatBotStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-700/50 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-100">ลูกค้าทั้งหมด</CardTitle>
          <Users className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100">{stats.totalCustomers}</div>
          <p className="text-xs text-slate-400">ลูกค้าที่มี Chatbot</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-700/50 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-100">Bot เปิดใช้งาน</CardTitle>
          <Bot className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-400">{stats.activeBotsCount}</div>
          <p className="text-xs text-slate-400">กำลังตอบอัตโนมัติ</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-700/50 shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-100">Bot ปิดใช้งาน</CardTitle>
          <BotOff className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-400">{stats.inactiveBotsCount}</div>
          <p className="text-xs text-slate-400">ตอบแบบ Manual</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-700/50 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-100">อัตราการใช้งาน</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">{stats.activePercentage}%</div>
          <p className="text-xs text-slate-400">Bot ที่ใช้งาน</p>
        </CardContent>
      </Card>
    </div>
  );
}
