import { useAdsCampaigns } from "@/hooks/useAdsCampaigns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Megaphone, Search } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ฟังก์ชันสำหรับ highlight คำที่ค้นหาเจอ (แบบง่ายและมีประสิทธิภาพ)
const highlightText = (text: string, searchWords: string[]): React.ReactNode => {
  if (!text || searchWords.length === 0) {
    return text;
  }
  
  // ใช้วิธีง่ายๆ: แบ่ง text เป็นส่วนๆ และ highlight ส่วนที่ match
  let result: React.ReactNode[] = [];
  let remainingText = text;
  let keyIndex = 0;
  
  // สร้าง regex pattern จาก searchWords (escape special characters)
  const pattern = searchWords
    .map(word => {
      const normalizedWord = word
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return normalizedWord;
    })
    .join('|');
  
  if (!pattern) {
    return text;
  }
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = remainingText.split(regex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        
        // ตรวจสอบว่า part นี้ match กับ searchWords หรือไม่
        const normalizedPart = part
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        
        const isMatch = searchWords.some(word => {
          const normalizedWord = word
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          return normalizedPart.includes(normalizedWord);
        });
        
        if (isMatch) {
          return (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium">
              {part}
            </mark>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface AdCampaignSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const AdCampaignSelect = ({
  value,
  onValueChange,
  placeholder = "เลือกแคมเปญโฆษณา (ถ้ามี)",
  disabled = false,
}: AdCampaignSelectProps) => {
  const { activeCampaignsThisMonth, isLoading } = useAdsCampaigns();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  
  // ดึง campaign ที่เลือกมาแสดง (แม้ว่ามันจะไม่อยู่ใน activeCampaignsThisMonth)
  useEffect(() => {
    if (value && value !== 'none' && value !== '') {
      const campaignId = parseInt(value);
      console.log('🔍 AdCampaignSelect - Looking for campaign:', {
        value,
        campaignId,
        activeCampaignsCount: activeCampaignsThisMonth.length
      });
      
      // เช็คว่ามีใน activeCampaignsThisMonth หรือไม่
      const foundInActive = activeCampaignsThisMonth.find(c => c.id === campaignId);
      
      if (foundInActive) {
        console.log('✅ Found campaign in active list:', foundInActive.name);
        setSelectedCampaign(foundInActive);
      } else {
        console.log('⚠️ Campaign not in active list, fetching from database...');
        // ถ้าไม่มีใน activeCampaignsThisMonth ให้ดึงจาก database
        supabase
          .from('ads_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching campaign:', error);
            } else if (data) {
              console.log('✅ Fetched campaign from database:', data.name);
              setSelectedCampaign(data);
            } else {
              console.warn('⚠️ Campaign not found in database');
            }
          });
      }
    } else {
      setSelectedCampaign(null);
    }
  }, [value, activeCampaignsThisMonth]);

  // ฟังก์ชันคำนวณคะแนนความเกี่ยวข้อง (scoring) - ยืดหยุ่นและรองรับคำสั้นๆ
  const calculateRelevanceScore = (campaign: any, searchWords: string[]): number => {
    let score = 0;
    
    // สร้าง searchable text จากทุก field พร้อม weights
    const fields = [
      { text: campaign.name || '', weight: 10 }, // น้ำหนักสูงสุด
      { text: campaign.campaign_name || '', weight: 8 },
      { text: campaign.description || '', weight: 5 },
      { text: campaign.facebook_ad_id || '', weight: 3 },
      { text: campaign.facebook_campaign_id || '', weight: 3 }
    ];
    
    const normalizedSearchWords = searchWords.map(word => 
      word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    );
    
    fields.forEach(field => {
      const normalizedText = field.text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      
      normalizedSearchWords.forEach((word, index) => {
        // Exact match (คำตรงกันทุกตัวอักษร) - คะแนนสูงสุด
        if (normalizedText === word) {
          score += field.weight * 100;
        }
        // Starts with (ขึ้นต้นด้วย) - คะแนนสูง
        else if (normalizedText.startsWith(word)) {
          score += field.weight * 50;
        }
        // Contains (มีคำนั้น) - คะแนนปานกลาง
        else if (normalizedText.includes(word)) {
          score += field.weight * 20;
        }
        // Partial match (บางส่วนของคำ) - รองรับคำสั้นๆ
        else {
          // แบ่ง text เป็นคำๆ
          const wordsInText = normalizedText.split(/\s+/);
          
          // ตรวจสอบว่า word เป็นส่วนหนึ่งของคำใน text หรือไม่
          const matchesPartial = wordsInText.some(textWord => {
            // ถ้า word สั้นมาก (1-2 ตัวอักษร) ให้ตรวจสอบว่าเป็นส่วนแรกของคำ
            if (word.length <= 2) {
              return textWord.startsWith(word);
            }
            // ถ้า word ยาวกว่า ให้ตรวจสอบว่าเป็นส่วนหนึ่งของคำ
            return textWord.includes(word) || word.includes(textWord);
          });
          
          if (matchesPartial) {
            // ให้คะแนนตามความยาวของ word (คำสั้นๆ ได้คะแนนน้อยกว่า)
            const partialScore = word.length >= 3 ? field.weight * 5 : field.weight * 2;
            score += partialScore;
          }
          
          // Fuzzy match: ตรวจสอบว่ามีตัวอักษรที่ตรงกันหลายตัวหรือไม่ (สำหรับคำสั้นๆ)
          if (word.length >= 1 && word.length <= 3) {
            let matchingChars = 0;
            for (let i = 0; i < word.length; i++) {
              if (normalizedText.includes(word[i])) {
                matchingChars++;
              }
            }
            // ถ้ามีตัวอักษรที่ตรงกันมากกว่า 50% ให้คะแนน
            if (matchingChars / word.length >= 0.5) {
              score += field.weight * 1;
            }
          }
        }
        
        // Bonus สำหรับคำแรก (ให้ความสำคัญมากกว่า)
        if (index === 0) {
          score += 5;
        }
      });
    });
    
    return score;
  };

  // Filter campaigns ตาม search term - ยืดหยุ่นและรองรับคำสั้นๆ
  const displayCampaigns = useMemo(() => {
    // รวม campaign ที่เลือกเข้าไปด้วย (ถ้ามีและไม่อยู่ใน activeCampaignsThisMonth)
    let campaignsToDisplay = [...activeCampaignsThisMonth];
    if (selectedCampaign && !activeCampaignsThisMonth.find(c => c.id === selectedCampaign.id)) {
      campaignsToDisplay = [selectedCampaign, ...campaignsToDisplay];
    }
    
    if (!searchTerm.trim()) {
      return campaignsToDisplay;
    }
    
    // แบ่งคำค้นหาเป็น array (รองรับการค้นหาหลายคำ)
    const searchWords = searchTerm
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (searchWords.length === 0) {
      return campaignsToDisplay;
    }
    
    // คำนวณคะแนนสำหรับแต่ละ campaign
    const campaignsWithScore = campaignsToDisplay.map(campaign => ({
      campaign,
      score: calculateRelevanceScore(campaign, searchWords)
    }));
    
    // กรองและเรียงลำดับ: แสดงผลลัพธ์ที่มีคะแนน > 0 (ยืดหยุ่น - แม้แต่คำสั้นๆ ก็แสดง)
    // เรียงตามคะแนน (สูงสุดก่อน) และจำกัดผลลัพธ์สูงสุด 50 รายการ
    return campaignsWithScore
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // เรียงตามคะแนน (สูงสุดก่อน)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        
        // ถ้าคะแนนเท่ากัน ให้เรียงตามชื่อ
        const aName = (a.campaign.name || '').toLowerCase();
        const bName = (b.campaign.name || '').toLowerCase();
        return aName.localeCompare(bName, 'th');
      })
      .slice(0, 50) // จำกัดผลลัพธ์สูงสุด 50 รายการเพื่อประสิทธิภาพ
      .map(item => item.campaign);
  }, [activeCampaignsThisMonth, searchTerm, selectedCampaign]);

  // Debug: Log current state (ต้องอยู่ก่อน early return)
  useEffect(() => {
    if (value && value !== 'none' && value !== '') {
      console.log('🎯 AdCampaignSelect render:', {
        value,
        selectedCampaign: selectedCampaign?.name || 'not found',
        displayCampaignsCount: displayCampaigns.length,
        isLoading
      });
    }
  }, [value, selectedCampaign, displayCampaigns.length, isLoading]);

  // Early return ต้องอยู่หลัง hooks ทั้งหมด
  if (isLoading) {
    return (
      <Select disabled={true}>
        <SelectTrigger className="h-11 border-2 border-gray-300">
          <SelectValue placeholder="กำลังโหลด..." />
        </SelectTrigger>
      </Select>
    );
  }

  // ตรวจสอบว่า value ถูกต้อง
  const selectValue = value && value !== 'none' && value !== '' ? value : undefined;
  
  return (
    <Select value={selectValue} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3">
        <SelectValue placeholder={placeholder}>
          {value && value !== 'none' && value !== '' ? (
            (() => {
              // ใช้ selectedCampaign state ที่ดึงมาแล้ว
              const campaignToShow = selectedCampaign || displayCampaigns.find(
                (campaign) => campaign.id.toString() === value
              );
              if (campaignToShow) {
                return (
                  <div className="flex items-center gap-2">
                    {campaignToShow.image_url ? (
                      <img
                        src={campaignToShow.image_url}
                        alt={campaignToShow.name}
                        className="w-6 h-6 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Megaphone className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="truncate">{campaignToShow.name}</span>
                  </div>
                );
              }
              // Fallback: แสดง campaign ID ถ้ายังไม่เจอชื่อ
              return `Campaign ID: ${value}`;
            })()
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        className="max-h-[500px]"
        style={{ width: 'var(--radix-select-trigger-width)', minWidth: '600px' }}
      >
        {/* Search Box */}
        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="ค้นหาชื่อแอด, Campaign, คำอธิบาย หรือ ID (รองรับหลายคำ)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                // ป้องกันไม่ให้ arrow keys ปิด dropdown หรือเปลี่ยน selection
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                }
                // ป้องกันไม่ให้ Enter หรือ Space ปิด dropdown
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                }
              }}
              onFocus={(e) => {
                // Keep focus on input
                e.stopPropagation();
              }}
              onBlur={(e) => {
                // Prevent blur when clicking inside select content
                e.stopPropagation();
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            แสดง {displayCampaigns.length} จาก {activeCampaignsThisMonth.length} แอด
          </p>
        </div>

        <SelectItem value="none" className="hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900">ไม่ระบุ</SelectItem>
        
        {displayCampaigns.length === 0 && searchTerm && (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            ไม่พบแอดที่ค้นหา "{searchTerm}"
          </div>
        )}
        
        {displayCampaigns.length === 0 && !searchTerm && (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            ไม่มีแอดที่ Active อยู่ในเดือนนี้
          </div>
        )}
        
        {displayCampaigns.map((campaign) => (
          <SelectItem 
            key={campaign.id} 
            value={campaign.id.toString()}
            className="hover:bg-green-50 focus:bg-green-50 focus:text-gray-900 data-[state=checked]:bg-green-100 p-0"
          >
            <div className="flex items-start gap-3 py-3 px-2 w-full">
              {campaign.image_url ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border-2 border-gray-200 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 py-1">
                <p className="font-medium text-base leading-tight mb-1">
                  {searchTerm.trim() 
                    ? highlightText(
                        campaign.name, 
                        searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
                      )
                    : campaign.name
                  }
                </p>
                {campaign.campaign_name && (
                  <p className="text-sm text-gray-600 mb-1">
                    {searchTerm.trim() 
                      ? highlightText(
                          campaign.campaign_name, 
                          searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
                        )
                      : campaign.campaign_name
                    }
                  </p>
                )}
                {campaign.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed whitespace-pre-wrap break-words">
                    {searchTerm.trim() 
                      ? highlightText(
                          campaign.description, 
                          searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0)
                        )
                      : campaign.description
                    }
                  </p>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AdCampaignSelect;

