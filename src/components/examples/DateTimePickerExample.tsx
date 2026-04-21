import React, { useState } from 'react';
import DateTimePicker from '@/components/ui/DateTimePicker';

const DateTimePickerExample = () => {
  const [dateTime, setDateTime] = useState<string>('');

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">ตัวอย่าง DateTimePicker (24 ชั่วโมง)</h2>
      
      <div className="space-y-4">
        <DateTimePicker
          label="เลือกวันที่และเวลา"
          value={dateTime}
          onChange={setDateTime}
          placeholder="คลิกเพื่อเลือกวันที่และเวลา"
          required
        />
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-medium mb-2">ค่าที่เลือก:</h3>
          <p className="text-sm text-gray-600">
            {dateTime || 'ยังไม่ได้เลือก'}
          </p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2 text-blue-900">คุณสมบัติใหม่:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ ไม่มี option "--" ที่อาจทำให้ error</li>
            <li>✅ ค่าเริ่มต้น: 09:00 (9 โมงเช้า)</li>
            <li>✅ เลือกชั่วโมง: 00-23 (24 ชั่วโมง)</li>
            <li>✅ เลือกนาที: 00, 15, 30, 45</li>
            <li>✅ วันที่เริ่มต้น: วันนี้</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DateTimePickerExample;
