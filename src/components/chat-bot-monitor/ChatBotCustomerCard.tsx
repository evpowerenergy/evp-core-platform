import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useToggleChatBot, type ChatBotCustomer } from '@/hooks/useChatBotMonitor';

interface ChatBotCustomerCardProps {
  customer: ChatBotCustomer;
}

export function ChatBotCustomerCard({ customer }: ChatBotCustomerCardProps) {
  const toggleBot = useToggleChatBot();
  
  const handleToggle = (checked: boolean) => {
    if (!customer.sender_id) return;
    
    toggleBot.mutate({
      senderId: customer.sender_id,
      newMode: checked ? 'auto' : 'human'
    });
  };

  const customerName = customer.full_name || customer.display_name || 'ไม่ระบุชื่อ';
  const isActive = customer.is_bot_active;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{customerName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                {isActive ? '🟢 Bot เปิด' : '🔴 Bot ปิด'}
              </Badge>
            </div>
          </div>
          
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={toggleBot.isPending}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Contact Info */}
        {customer.tel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{customer.tel}</span>
          </div>
        )}
        
        {customer.line_id && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{customer.line_id}</span>
          </div>
        )}

        {/* Last Message */}
        {customer.last_message && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              ข้อความล่าสุด:
            </p>
            <p className="text-sm line-clamp-2">{customer.last_message}</p>
          </div>
        )}
        
        {/* Last Update */}
        {customer.last_message_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(customer.last_message_time), { 
                addSuffix: true, 
                locale: th 
              })}
            </span>
          </div>
        )}

        {/* Products Shown */}
        {customer.shown_product_keys?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">สินค้าที่แสดง:</p>
            <div className="flex flex-wrap gap-1">
              {customer.shown_product_keys.map((key, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {key}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
