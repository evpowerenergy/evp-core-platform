import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FileUpload from "@/components/ui/file-upload";
import { Control } from "react-hook-form";
import { QrCode } from "lucide-react";

interface QRCodeSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

const QRCodeSection = ({ control, disabled = false }: QRCodeSectionProps) => {
  return (
    <div className="bg-white/70 p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></div>
        <QrCode className="w-5 h-5 mr-2 text-green-600" />
        QR Code
      </h3>
      <div className="space-y-4">
        <FormField
          control={control}
          name="qr_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">อัพโหลด QR Code</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value}
                  onChange={field.onChange}
                  accept="image/*"
                  maxSize={5}
                  label=""
                  placeholder="ลากไฟล์ QR Code มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์"
                  className="w-full"
                  useStorage={true}
                  storageBucket="qr-codes"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">คำแนะนำ:</p>
          <ul className="space-y-1">
            <li>• รองรับไฟล์รูปภาพ: JPG, PNG, GIF</li>
            <li>• ขนาดไฟล์สูงสุด: 5MB</li>
            <li>• สามารถลากไฟล์มาวางได้</li>
            <li>• QR Code จะถูกแสดงตัวอย่างด้านล่าง</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRCodeSection; 