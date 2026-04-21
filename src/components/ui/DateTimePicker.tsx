import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Calendar, Clock } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { th } from 'date-fns/locale';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "เลือกวันที่และเวลา",
  className = "",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [displayValue, setDisplayValue] = useState<string>('');

  // แปลงค่าเริ่มต้น
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (isValid(date)) {
          setSelectedDate(format(date, 'yyyy-MM-dd'));
          setSelectedTime(format(date, 'HH:mm'));
          setDisplayValue(format(date, 'dd/MM/yyyy HH:mm', { locale: th }));
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    } else {
      setSelectedDate('');
      setSelectedTime('09:00');
      setDisplayValue('');
    }
  }, [value]);

  // สร้างรายการชั่วโมง (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: hour, label: `${hour}:00` };
  });

  // สร้างรายการนาที (0-59) แบบรายนาที
  const minutes = Array.from({ length: 60 }, (_, i) => {
    return i.toString().padStart(2, '0');
  });

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    updateValue(date, selectedTime);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    updateValue(selectedDate, time);
  };

  const updateValue = (date: string, time: string) => {
    if (date && time) {
      const dateTimeString = `${date}T${time}`;
      onChange(dateTimeString);
      setDisplayValue(format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm', { locale: th }));
    }
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const dateTimeString = `${selectedDate}T${selectedTime}`;
      onChange(dateTimeString);
      setDisplayValue(format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm', { locale: th }));
    }
    setIsOpen(false);
  };

  const handleOpen = () => {
    // ถ้ายังไม่มีวันที่ ให้ใช้วันนี้
    if (!selectedDate) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      setSelectedDate(todayString);
    }
    setIsOpen(!isOpen);
  };

  const handleClear = () => {
    setSelectedDate('');
    setSelectedTime('09:00');
    setDisplayValue('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label className="text-sm font-medium mb-2 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          onClick={handleOpen}
          className="cursor-pointer pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Calendar className="h-4 w-4 text-gray-400" />
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="space-y-4">
            {/* Date Picker */}
            <div>
              <Label className="text-sm font-medium mb-2 block">เลือกวันที่</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Time Picker */}
            <div>
              <Label className="text-sm font-medium mb-2 block">เลือกเวลา</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">เวลา</Label>
                  <select
                    value={selectedTime.split(':')[0] || '00'}
                    onChange={(e) => {
                      const minutes = selectedTime.split(':')[1] || '00';
                      handleTimeChange(`${e.target.value}:${minutes}`);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {hours.map((hour) => (
                      <option key={hour.value} value={hour.value}>
                        {hour.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">นาที</Label>
                  <select
                    value={selectedTime.split(':')[1] || '00'}
                    onChange={(e) => {
                      const hours = selectedTime.split(':')[0] || '00';
                      handleTimeChange(`${hours}:${e.target.value}`);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {minutes.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                ล้าง
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={!selectedDate}
              >
                ตกลง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close picker */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateTimePicker;
