
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface BasicInfoSectionProps {
  control: Control<any>;
}

const BasicInfoSection = ({ control }: BasicInfoSectionProps) => {
  return (
    <div className="bg-white/70 p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></div>
        ข้อมูลพื้นฐาน
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">ชื่อเต็ม</FormLabel>
              <FormControl>
                <Input 
                  placeholder="ชื่อ-นามสกุล ของลูกค้า" 
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">ชื่อบนแพลตฟอร์ม</FormLabel>
              <FormControl>
                <Input 
                  placeholder="ชื่อที่แสดงบนแพลตฟอร์ม" 
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">อีเมล</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="example@email.com" 
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200" 
                  {...field} 
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

export default BasicInfoSection;
