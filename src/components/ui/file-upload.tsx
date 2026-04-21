import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  useStorage?: boolean; // New prop to enable Supabase Storage
  storageBucket?: string; // Storage bucket name
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  onFileChange,
  accept = "image/*",
  maxSize = 5, // 5MB default
  label = "อัพโหลดไฟล์",
  placeholder = "เลือกไฟล์หรือลากไฟล์มาวางที่นี่",
  className,
  disabled = false,
  useStorage = false,
  storageBucket = 'qr-codes'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`ขนาดไฟล์ต้องไม่เกิน ${maxSize}MB`);
      return;
    }

    if (useStorage) {
      // Upload to Supabase Storage
      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(storageBucket)
          .getPublicUrl(fileName);

        onChange(publicUrl);
        if (onFileChange) {
          onFileChange(file);
        }
        toast.success('อัพโหลดไฟล์สำเร็จ');
      } catch (error: any) {
        console.error('Upload error:', error);
        setError(`เกิดข้อผิดพลาดในการอัพโหลด: ${error.message}`);
        toast.error('เกิดข้อผิดพลาดในการอัพโหลดไฟล์');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Convert to base64 (original behavior)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        if (onFileChange) {
          onFileChange(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = async () => {
    if (useStorage && value) {
      // Try to delete from storage
      try {
        const fileName = value.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from(storageBucket)
            .remove([fileName]);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue even if deletion fails
      }
    }
    
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-gray-700 font-medium">{label}</Label>}
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
          dragActive 
            ? "border-green-500 bg-green-50" 
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {!value ? (
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">{placeholder}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="mt-2"
            >
              {isUploading ? 'กำลังอัพโหลด...' : 'เลือกไฟล์'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">
              {isUploading ? 'กำลังอัพโหลด...' : 'ไฟล์ถูกอัพโหลดแล้ว'}
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                เปลี่ยนไฟล์
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeFile}
                disabled={disabled || isUploading}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {value && (
        <div className="mt-2">
          <img 
            src={value} 
            alt="Preview" 
            className="max-w-full h-32 object-contain rounded border"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 