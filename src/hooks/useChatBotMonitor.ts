import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

export interface ChatBotCustomer {
  lead_id: number;
  full_name: string | null;
  display_name: string | null;
  tel: string | null;
  line_id: string | null;
  user_id_platform: string;
  sender_id: string;
  auto_reply_mode: string | null;
  last_update: string;
  last_toggled_at: string | null;
  shown_product_keys: string[];
  is_bot_active: boolean;
  last_message: string | null;
  last_message_time: string | null;
  last_sender_type: string | null;
}

// Hook สำหรับดึงข้อมูลลูกค้าทั้งหมด พร้อม date range filter
export const useChatBotMonitor = (dateRange?: DateRange) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-bot-monitor', dateRange],
    queryFn: async () => {
      // ดึงข้อมูล chat_state ทั้งหมดก่อน
      const { data: chatStates, error: chatStateError } = await supabase
        .from('chat_state')
        .select('*');
      
      if (chatStateError) throw chatStateError;
      if (!chatStates || chatStates.length === 0) return [];

      // ดึง sender_ids ทั้งหมดจาก chat_state
      const senderIds = chatStates.map(cs => cs.sender_id);

      // กรองเฉพาะ sender_ids ที่ไม่เป็น null
      const validSenderIds = senderIds.filter(id => id != null);

      // ตรวจสอบว่ามี valid sender IDs
      if (validSenderIds.length === 0) return [];

      // ดึงข้อมูล leads แบ่งเป็น batch เพื่อป้องกัน URL ยาวเกินไป
      const BATCH_SIZE = 100; // จำกัดจำนวน IDs ต่อ query
      let allLeadsData: any[] = [];
      
      for (let i = 0; i < validSenderIds.length; i += BATCH_SIZE) {
        const batchIds = validSenderIds.slice(i, i + BATCH_SIZE);
        const { data: leadsBatch, error: leadsError } = await supabase
          .from('leads')
          .select('id, full_name, display_name, tel, line_id, user_id_platform')
          .in('user_id_platform', batchIds);
        
        if (leadsError) throw leadsError;
        if (leadsBatch) {
          allLeadsData = allLeadsData.concat(leadsBatch);
        }
      }
      
      const leadsData = allLeadsData;
      if (!leadsData || leadsData.length === 0) return [];

      // สร้าง map ของ chat_state สำหรับ lookup ที่รวดเร็ว
      const chatStateMap = new Map(chatStates.map(cs => [cs.sender_id, cs]));

      // ดึงข้อมูล chat_state และข้อความล่าสุดสำหรับแต่ละคน
      const enrichedData = await Promise.all(
        leadsData.map(async (lead) => {
          const chatState = chatStateMap.get(lead.user_id_platform!);
          
          // สร้าง query สำหรับ conversations พร้อม date filter
          let conversationsQuery = supabase
            .from('conversations')
            .select('message, created_at, sender_type')
            .eq('lead_id', lead.id);
          
          // เพิ่ม date range filter ถ้ามี
          if (dateRange?.from) {
            const fromDate = new Date(dateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            conversationsQuery = conversationsQuery.gte('created_at', fromDate.toISOString());
          }
          
          if (dateRange?.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            conversationsQuery = conversationsQuery.lte('created_at', toDate.toISOString());
          }
          
          const { data: lastMessage } = await conversationsQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            lead_id: lead.id,
            full_name: lead.full_name,
            display_name: lead.display_name,
            tel: lead.tel,
            line_id: lead.line_id,
            user_id_platform: lead.user_id_platform!,
            sender_id: lead.user_id_platform!,
            auto_reply_mode: chatState?.auto_reply_mode || 'auto',
            last_update: chatState?.last_update || new Date().toISOString(),
            last_toggled_at: chatState?.last_toggled_at || null,
            shown_product_keys: chatState?.shown_product_keys || [],
            is_bot_active: chatState?.auto_reply_mode === 'auto',
            last_message: lastMessage?.message || null,
            last_message_time: lastMessage?.created_at || null,
            last_sender_type: lastMessage?.sender_type || null
          };
        })
      );
      
      // Filter out customers with no messages in the date range (if date filter is active)
      const filteredData = dateRange?.from 
        ? enrichedData.filter(customer => customer.last_message_time !== null)
        : enrichedData;

      // เรียงตามข้อความล่าสุด
      return filteredData.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return timeB - timeA;
      });
    },
    refetchInterval: 30000, // Refetch ทุก 30 วินาที
  });

  return query;
};

// Hook สำหรับเปิด/ปิดบอท
export const useToggleChatBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      senderId, 
      newMode 
    }: { 
      senderId: string; 
      newMode: 'auto' | 'human' 
    }) => {
      const { data, error } = await supabase
        .from('chat_state')
        .upsert({ 
          sender_id: senderId,
          auto_reply_mode: newMode,
          last_toggled_at: new Date().toISOString(),
          last_update: new Date().toISOString()
        }, {
          onConflict: 'sender_id',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Chat state upsert error:', error);
        throw error;
      }
      return data;
    },
    // Optimistic Update - อัปเดต UI ทันทีก่อนที่ API จะตอบกลับ
    onMutate: async ({ senderId, newMode }) => {
      // ยกเลิก queries ที่กำลังรันอยู่เพื่อป้องกัน race condition
      await queryClient.cancelQueries({ queryKey: ['chat-bot-monitor'] });
      
      // เก็บค่าเดิมไว้สำหรับ rollback และอัปเดตทุก query key
      const allQueries = queryClient.getQueriesData<ChatBotCustomer[]>({ queryKey: ['chat-bot-monitor'] });
      const previousDataList = allQueries.map(([key, data]) => ({ key, data }));
      
      // อัปเดต cache ทันทีด้วยค่าใหม่ สำหรับทุก query key
      allQueries.forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData<ChatBotCustomer[]>(
            key,
            data.map(customer => 
              customer.sender_id === senderId
                ? { 
                    ...customer, 
                    is_bot_active: newMode === 'auto',
                    auto_reply_mode: newMode,
                    last_toggled_at: new Date().toISOString()
                  }
                : customer
            )
          );
        }
      });
      
      // Return context สำหรับ rollback
      return { previousDataList };
    },
    onSuccess: (data, variables) => {
      // อัปเดต cache ด้วยข้อมูลจริงจาก server สำหรับทุก query key
      const allQueries = queryClient.getQueriesData<ChatBotCustomer[]>({ queryKey: ['chat-bot-monitor'] });
      
      allQueries.forEach(([key, currentData]) => {
        if (currentData && data) {
          queryClient.setQueryData<ChatBotCustomer[]>(
            key,
            currentData.map(customer => 
              customer.sender_id === variables.senderId
                ? { 
                    ...customer, 
                    is_bot_active: data.auto_reply_mode === 'auto',
                    auto_reply_mode: data.auto_reply_mode,
                    last_toggled_at: data.last_toggled_at,
                    last_update: data.last_update
                  }
                : customer
            )
          );
        }
      });
      
      toast.success(
        variables.newMode === 'auto' 
          ? '✅ เปิด Chatbot สำเร็จ - บอทจะตอบอัตโนมัติ' 
          : '⏸️ ปิด Chatbot สำเร็จ - คุณสามารถไปตอบใน Facebook/LINE ได้เลย'
      );
    },
    onError: (error, _, context) => {
      // Rollback ไปที่ค่าเดิมถ้าเกิด error
      if (context?.previousDataList) {
        context.previousDataList.forEach(({ key, data }) => {
          if (data) {
            queryClient.setQueryData(key, data);
          }
        });
      }
      toast.error('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
  });
};

// Hook สำหรับคำนวณสถิติ
export const useChatBotStats = (data: ChatBotCustomer[] | undefined) => {
  if (!data) return null;
  
  const totalCustomers = data.length;
  const activeBotsCount = data.filter(d => d.is_bot_active).length;
  const inactiveBotsCount = data.filter(d => !d.is_bot_active).length;
  const activePercentage = totalCustomers > 0 
    ? Math.round((activeBotsCount / totalCustomers) * 100) 
    : 0;
  
  return {
    totalCustomers,
    activeBotsCount,
    inactiveBotsCount,
    activePercentage
  };
};
