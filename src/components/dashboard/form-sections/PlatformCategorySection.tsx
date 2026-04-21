
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";

interface PlatformCategorySectionProps {
  control: Control<any>;
}

const PlatformCategorySection = ({ control }: PlatformCategorySectionProps) => {
  return (
    <div className="bg-white/70 p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
        แพลตฟอร์มและหมวดหมู่
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">แพลตฟอร์ม</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200">
                    <SelectValue placeholder="เลือกแพลตฟอร์ม" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">ประเภทการขาย</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200">
                    <SelectValue placeholder="เลือกประเภทการขาย" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Package">Package</SelectItem>
                  <SelectItem value="Wholesales">Wholesales</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PlatformCategorySection;
