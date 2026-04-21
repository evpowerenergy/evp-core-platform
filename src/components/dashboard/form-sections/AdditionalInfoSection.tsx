import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface AdditionalInfoSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

const AdditionalInfoSection = ({ control, disabled = false }: AdditionalInfoSectionProps) => {
  return (
    <div className="bg-white/70 p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <div className="w-2 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full mr-3"></div>
        ข้อมูลเพิ่มเติม
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="avg_electricity_bill"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">ค่าไฟเฉลี่ย</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ค่าไฟเฉลี่ยต่อเดือน (บาท)" 
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200" 
                    {...field} 
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="daytime_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">เปอร์เซ็นต์การใช้ไฟช่วงกลางวัน</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="เปอร์เซ็นต์การใช้ไฟช่วงกลางวัน (%)" 
                    type="number"
                    min="0"
                    max="100"
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200" 
                    {...field} 
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">รายละเอียด</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับลูกค้า" 
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 min-h-[100px]" 
                  {...field} 
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default AdditionalInfoSection;
