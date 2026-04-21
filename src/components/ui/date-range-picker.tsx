import * as React from "react"
import { addDays, format, isValid } from "date-fns"
import { th } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateRangePickerProps {
  className?: string
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  presets?: boolean
}

export function DateRangePicker({
  className,
  value,
  onChange,
  placeholder = "ช่วงเวลาทั้งหมด",
  presets = true
}: DateRangePickerProps) {
  const [startDate, setStartDate] = React.useState<Date | undefined>(value?.from)
  const [endDate, setEndDate] = React.useState<Date | undefined>(value?.to)

  React.useEffect(() => {
    setStartDate(value?.from)
    setEndDate(value?.to)
  }, [value])

  const handleStartDateSelect = (selectedDate: Date | undefined) => {
    setStartDate(selectedDate)
    
    // If end date is before start date, clear end date
    if (selectedDate && endDate && selectedDate > endDate) {
      setEndDate(undefined)
      onChange?.({ from: selectedDate, to: undefined })
    } else {
      onChange?.({ from: selectedDate, to: endDate })
    }
  }

  const handleEndDateSelect = (selectedDate: Date | undefined) => {
    setEndDate(selectedDate)
    
    // If start date is after end date, clear start date  
    if (selectedDate && startDate && startDate > selectedDate) {
      setStartDate(undefined)
      onChange?.({ from: undefined, to: selectedDate })
    } else {
      onChange?.({ from: startDate, to: selectedDate })
    }
  }

  const handlePresetSelect = (preset: string) => {
    const now = new Date()
    let range: DateRange | undefined

    const getQuarterStart = (date: Date) => {
      const quarter = Math.floor(date.getMonth() / 3)
      return new Date(date.getFullYear(), quarter * 3, 1)
    }

    const getQuarterEnd = (date: Date) => {
      const quarter = Math.floor(date.getMonth() / 3)
      return new Date(date.getFullYear(), quarter * 3 + 3, 0)
    }

    switch (preset) {
      case "all_time":
        range = undefined
        break
      case "today":
        range = { from: now, to: now }
        break
      case "yesterday":
        const yesterday = addDays(now, -1)
        range = { from: yesterday, to: yesterday }
        break
      case "this_week":
        const startOfWeek = new Date(now)
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        startOfWeek.setDate(now.getDate() + diff)
        range = { from: startOfWeek, to: now }
        break

      case "this_month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        range = { from: startOfMonth, to: now }
        break
      case "last_month":
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        range = { from: startOfLastMonth, to: endOfLastMonth }
        break
      case "q1":
        range = { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 3, 0) }
        break
      case "q2":
        range = { from: new Date(now.getFullYear(), 3, 1), to: new Date(now.getFullYear(), 6, 0) }
        break
      case "q3":
        range = { from: new Date(now.getFullYear(), 6, 1), to: new Date(now.getFullYear(), 9, 0) }
        break
      case "q4":
        range = { from: new Date(now.getFullYear(), 9, 1), to: new Date(now.getFullYear(), 12, 0) }
        break
      case "last_7_days":
        range = { from: addDays(now, -6), to: now }
        break
      case "last_30_days":
        range = { from: addDays(now, -29), to: now }
        break
      case "last_90_days":
        range = { from: addDays(now, -89), to: now }
        break
      case "all":
        // ใช้ช่วงเวลา 365 วันย้อนหลัง (1 ปี) แทน undefined
        range = { from: addDays(now, -364), to: now }
        break
      default:
        range = undefined
    }

    if (range) {
      setStartDate(range.from)
      setEndDate(range.to)
    } else {
      setStartDate(undefined)
      setEndDate(undefined)
    }
    onChange?.(range)
  }

  const getDisplayText = () => {
    if (!startDate && !endDate) {
      return "ช่วงเวลาทั้งหมด"
    }

    // ตรวจสอบความถูกต้องของ Date ก่อนเรียก format
    if (endDate && startDate && isValid(startDate) && isValid(endDate)) {
      return `${format(startDate, "dd MMM yyyy", { locale: th })} - ${format(endDate, "dd MMM yyyy", { locale: th })}`
    }

    if (startDate && isValid(startDate)) {
      return format(startDate, "dd MMM yyyy", { locale: th })
    }

    return "ช่วงเวลาทั้งหมด"
  }

  const getDateFilterStyles = () => {
    const isActive = startDate || endDate
    return {
      trigger: `
        bg-white/90 dark:bg-slate-800/90 
        backdrop-blur-sm border-2 shadow-md 
        hover:shadow-lg focus:shadow-xl 
        transition-all duration-300 
        hover:scale-[1.02] focus:scale-[1.02] 
        ${isActive 
          ? 'border-green-500 dark:border-green-400 shadow-green-100 dark:shadow-green-900/50 hover:shadow-green-200 dark:hover:shadow-green-800/50 focus:border-green-600 dark:focus:border-green-300 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-green-500/30 bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/50 dark:hover:bg-green-900/30' 
          : 'border-gray-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 focus:border-green-400 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-green-500/30 hover:bg-green-50/30 dark:hover:bg-slate-700/50'
        }
      `,
      icon: `h-4 w-4 mr-2 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`,
      text: isActive ? 'text-green-700 dark:text-green-300 font-medium' : 'text-gray-700 dark:text-slate-200'
    }
  }

  const dateFilterStyles = getDateFilterStyles()

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal min-w-[140px] lg:w-64",
              dateFilterStyles.trigger,
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className={dateFilterStyles.icon} />
            <span className={dateFilterStyles.text}>
              {getDisplayText()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700" align="start">
          <div className="flex">
            {presets && (
              <div className="border-r border-gray-200 dark:border-slate-700">
                <div className="p-3 space-y-1">
                  <div className="text-sm font-medium mb-2 text-gray-900 dark:text-slate-100">ตัวเลือกด่วน</div>
                  
                  <Select onValueChange={handlePresetSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกช่วงเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_time">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-slate-500 rounded-full mr-2"></span>
                          <span>ช่วงเวลาทั้งหมด</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="today">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>วันนี้</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="yesterday">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                          <span>เมื่อวาน</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="this_week">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span>สัปดาห์นี้</span>
                        </div>
                      </SelectItem>

                      <SelectItem value="this_month">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          <span>เดือนนี้</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="last_month">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                          <span>เดือนที่แล้ว</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="q1">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                          <span>Q1 (ม.ค. - มี.ค.)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="q2">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          <span>Q2 (เม.ย. - มิ.ย.)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="q3">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-lime-500 rounded-full mr-2"></span>
                          <span>Q3 (ก.ค. - ก.ย.)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="q4">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                          <span>Q4 (ต.ค. - ธ.ค.)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="last_7_days">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                          <span>7 วันที่ผ่านมา</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="last_30_days">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                          <span>30 วันที่ผ่านมา</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="last_90_days">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                          <span>90 วันที่ผ่านมา</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="all">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                          <span>1 ปีที่ผ่านมา (365 วัน)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-3">
                    หรือเลือกจากปฏิทิน →
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-3">
              {/* Headers for Start and End Date */}
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-green-300 mb-2 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    วันที่เริ่มต้น
                  </h4>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-blue-300 mb-2 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    วันที่สิ้นสุด
                  </h4>
                </div>
              </div>
              
              {/* Two separate calendars */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    className={cn("p-2 pointer-events-auto border border-green-200 dark:border-green-700 rounded-lg bg-white dark:bg-slate-800")}
                    locale={th}
                    disabled={(date) => {
                      // Disable dates after end date if end date is selected
                      return endDate ? date > endDate : false
                    }}
                  />
                  {startDate && isValid(startDate) && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-2 font-medium">
                      เลือกแล้ว: {format(startDate, "dd MMM yyyy", { locale: th })}
                    </p>
                  )}
                </div>
                
                <div className="text-center">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    className={cn("p-2 pointer-events-auto border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800")}
                    locale={th}
                    disabled={(date) => {
                      // Disable dates before start date if start date is selected
                      return startDate ? date < startDate : false
                    }}
                  />
                  {endDate && isValid(endDate) && (
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-2 font-medium">
                      เลือกแล้ว: {format(endDate, "dd MMM yyyy", { locale: th })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Active Filter Indicator */}
      {(startDate || endDate) && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" style={{ position: 'absolute' }}></div>
      )}
    </div>
  )
}