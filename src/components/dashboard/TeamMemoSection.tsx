
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const TeamMemoSection = () => {
  const [memo, setMemo] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalMemo, setOriginalMemo] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadMemo();
  }, []);

  const loadMemo = () => {
    // In a real app, this would load from database
    const savedMemo = localStorage.getItem('team_memo') || 
      `📝 บันทึกการประชุมทีมขาย - สัปดาห์นี้

🎯 เป้าหมายสัปดาห์นี้:
- ปิดดีล 15 รายการ
- ติดตามลูกค้าเก่า 30 ราย
- ออกเยี่ยมลูกค้าใหม่ 20 ราย

📊 สถานการณ์ปัจจุบัน:
- ดีลปิดไปแล้ว 8 รายการ (53% ของเป้าหมาย)
- Pipeline มูลค่า 2.5 ล้านบาท
- อัตราแปลงเฉลี่ย 15.2%

⚠️ ประเด็นที่ต้องติดตาม:
- ลูกค้ากลุ่ม Solar Panel ตอบสนองช้า
- ราคาแข่งขันสูงในพื้นที่กรุงเทพ
- ต้องเร่งการออกใบเสนอราคา

💡 แนวทางสัปดาห์หน้า:
- เน้นการติดตามลูกค้าที่มีโอกาสสูง
- ปรับกลยุทธ์ราคาให้เหมาะสม
- เพิ่มช่องทางการติดต่อออนไลน์`;
    
    setMemo(savedMemo);
    setOriginalMemo(savedMemo);
  };

  const handleSave = () => {
    localStorage.setItem('team_memo', memo);
    setOriginalMemo(memo);
    setIsEditing(false);
    
    toast({
      title: "บันทึกสำเร็จ",
      description: "บันทึกของทีมได้รับการอัปเดตเรียบร้อยแล้ว"
    });
  };

  const handleCancel = () => {
    setMemo(originalMemo);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            บันทึกทีม / หมายเหตุ
          </CardTitle>
          
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                ยกเลิก
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                บันทึก
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="เพิ่มบันทึกสำหรับทีม..."
            className="min-h-64 resize-none"
          />
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 min-h-64">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {memo || 'ยังไม่มีบันทึก...'}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMemoSection;
