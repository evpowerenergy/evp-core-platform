import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ChatBotCustomer, useToggleChatBot } from '@/hooks/useChatBotMonitor';

interface ChatBotMonitorTableProps {
  data: ChatBotCustomer[];
}

export function ChatBotMonitorTable({ data }: ChatBotMonitorTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingSenderId, setLoadingSenderId] = useState<string | null>(null);
  const itemsPerPage = 20;
  const toggleMutation = useToggleChatBot();

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleToggle = (customer: ChatBotCustomer) => {
    const newMode = customer.is_bot_active ? 'human' : 'auto';
    setLoadingSenderId(customer.sender_id);
    
    toggleMutation.mutate({
      senderId: customer.sender_id,
      newMode: newMode
    }, {
      onSettled: () => {
        setLoadingSenderId(null);
      }
    });
  };

  // Extract response text from JSON or return original message
  const extractMessageText = (message: string | null): string => {
    if (!message) return '';
    
    try {
      const parsed = JSON.parse(message);
      // If it's a JSON object with response field, return the response
      if (parsed && typeof parsed === 'object' && 'response' in parsed) {
        return parsed.response;
      }
    } catch {
      // If parsing fails, it's just a normal text message
    }
    
    // Return original message for non-JSON or JSON without response field
    return message;
  };

  if (data.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-700/50 shadow-2xl">
        <Bot className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-300">ไม่พบข้อมูลที่ค้นหา</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-700/50 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="w-[50px] text-slate-200">#</TableHead>
                <TableHead className="text-slate-200">ชื่อลูกค้า</TableHead>
                <TableHead className="text-slate-200">Sender ID</TableHead>
                <TableHead className="text-slate-200">ผู้ส่งล่าสุด</TableHead>
                <TableHead className="min-w-[250px] text-slate-200">ข้อความล่าสุด</TableHead>
                <TableHead className="text-slate-200">เวลา</TableHead>
                <TableHead className="text-center text-slate-200">สถานะบอท</TableHead>
                <TableHead className="text-center text-slate-200">เปิด/ปิดบอท</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((customer, index) => (
                <TableRow key={customer.sender_id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-200">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-100">
                      {customer.display_name || customer.full_name || 'ไม่ระบุชื่อ'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.sender_id ? (
                        <div className="text-slate-400 font-mono">
                          {customer.sender_id}
                        </div>
                      ) : (
                        <div className="text-slate-400">-</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.last_sender_type ? (
                      <Badge variant={customer.last_sender_type === 'user_message' ? 'secondary' : 'outline'} className="bg-slate-700 text-slate-200 border-slate-600">
                        {customer.last_sender_type === 'user_message' ? '👤 ลูกค้า' : '🤖 AI'}
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[250px] max-w-[400px]">
                      {customer.last_message ? (
                        <p className="text-sm text-slate-200 line-clamp-2 whitespace-pre-wrap break-words">
                          {extractMessageText(customer.last_message)}
                        </p>
                      ) : (
                        <span className="text-sm text-slate-400 italic">ยังไม่มีข้อความ</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.last_message_time ? (
                      <span className="text-sm text-slate-400">
                        {formatDistanceToNow(new Date(customer.last_message_time), {
                          addSuffix: true,
                          locale: th
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={loadingSenderId === customer.sender_id ? 'opacity-50' : ''}>
                      {customer.is_bot_active ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          🟢 เปิด
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-700 text-slate-200 border-slate-600">
                          🔴 ปิด
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {loadingSenderId === customer.sender_id && (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      )}
                      <Switch
                        checked={customer.is_bot_active}
                        onCheckedChange={() => handleToggle(customer)}
                        disabled={loadingSenderId === customer.sender_id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            แสดง {startIndex + 1}-{Math.min(endIndex, data.length)} จาก {data.length} รายการ
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              ก่อนหน้า
            </Button>
            <div className="text-sm text-slate-300">
              หน้า {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
            >
              ถัดไป
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
