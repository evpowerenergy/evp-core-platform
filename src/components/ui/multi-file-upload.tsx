import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from './button';
import { Label } from './label';
import { Upload, X, FileText, Image as ImageIcon, FileCode, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from './progress';

export interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface PendingFile {
  file: File;
  preview?: string;
}

interface MultiFileUploadProps {
  value?: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  storageBucket?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  allowedTypes?: string[]; // MIME types or extensions
}

export interface MultiFileUploadRef {
  uploadPendingFiles: () => Promise<FileAttachment[]>;
  getPendingFiles: () => PendingFile[];
  deleteRemovedFiles: () => Promise<void>;
}

const MultiFileUpload = forwardRef<MultiFileUploadRef, MultiFileUploadProps>(({
  value = [],
  onChange,
  maxFiles = 30,
  maxSizePerFile = 50, // 50MB default
  storageBucket = 'permit-documents',
  label = "แนบเอกสาร",
  disabled = false,
  className,
  allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Adobe
    'application/illustrator',
    'application/photoshop',
    'application/x-indesign',
    // CAD
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'image/x-dwg',
    'application/dxf',
    'application/x-dxf',
    'application/step',
    'application/sla',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ]
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [filesToDelete, setFilesToDelete] = useState<FileAttachment[]>([]); // Track files marked for deletion

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-5 w-5" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="h-5 w-5" />;
    if (type.includes('cad') || type.includes('dwg') || type.includes('dxf')) return <FileCode className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file count (existing uploaded + pending + new file)
    const totalFiles = value.length + pendingFiles.length;
    if (totalFiles >= maxFiles) {
      return `สามารถแนบไฟล์ได้สูงสุด ${maxFiles} ไฟล์`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizePerFile) {
      return `ไฟล์มีขนาดใหญ่เกิน ${maxSizePerFile}MB`;
    }

    // Check file type (basic check)
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
                               '.txt', '.csv', '.ai', '.psd', '.indd', '.dwg', '.dxf', 
                               '.stp', '.step', '.igs', '.iges', '.stl', '.jpg', '.jpeg', 
                               '.png', '.gif', '.bmp', '.tiff'];
    
    if (!allowedExtensions.includes(extension)) {
      return `ไฟล์ประเภท ${extension} ไม่รองรับ`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
      const validFiles: PendingFile[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      validFiles.push({ file, preview });
    }

    if (validFiles.length === 0) return;

    setPendingFiles(prev => [...prev, ...validFiles]);
    toast.success(`เลือกไฟล์สำเร็จ ${validFiles.length} ไฟล์ (กดบันทึกเพื่ออัปโหลด)`);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    uploadPendingFiles: async () => {
      if (pendingFiles.length === 0) {
        return [];
      }

      const uploadedFiles: FileAttachment[] = [];

      for (const { file } of pendingFiles) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from(storageBucket)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(storageBucket)
            .getPublicUrl(fileName);

          uploadedFiles.push({
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          });

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (error: any) {
          console.error('Upload error:', error);
          toast.error(`ไม่สามารถอัพโหลด ${file.name}: ${error.message}`);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
          throw error; // Re-throw to stop the form submission
        }
      }

      // Clear pending files and progress after successful upload
      setPendingFiles([]);
      setTimeout(() => {
        setUploadProgress({});
      }, 2000);

      return uploadedFiles;
    },
    getPendingFiles: () => pendingFiles,
    deleteRemovedFiles: async () => {
      // Delete files marked for deletion from storage
      for (const fileToDelete of filesToDelete) {
        try {
          const fileName = fileToDelete.url.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from(storageBucket)
              .remove([fileName]);
          }
        } catch (error) {
          console.error('Error deleting file:', error);
          // Don't throw - continue deleting other files
        }
      }
      // Clear the deletion queue after successful deletion
      setFilesToDelete([]);
    }
  }));

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragActive to false if leaving the drop zone itself, not child elements
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // This is important for the drop to work
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || totalFiles >= maxFiles) {
      toast.error(`ไม่สามารถเพิ่มไฟล์ได้ (ถึงขีดจำกัด ${maxFiles} ไฟล์แล้ว)`);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
      // Clear the data transfer
      e.dataTransfer.clearData();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const removePendingFile = (index: number) => {
    const fileToRemove = pendingFiles[index];
    
    // Revoke object URL for images to free memory
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('ลบไฟล์สำเร็จ');
  };

  const removeUploadedFile = (index: number) => {
    const fileToRemove = value[index];
    
    // Mark file for deletion (will be deleted when form is saved)
    setFilesToDelete(prev => [...prev, fileToRemove]);
    
    // Remove from current value immediately (UI update)
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
    
    toast.success('ทำเครื่องหมายลบไฟล์แล้ว (จะลบจริงเมื่อบันทึกฟอร์ม)');
  };

  const totalFiles = value.length + pendingFiles.length;

  return (
    <div className={cn("space-y-4", className)}>
      {label && <Label className="text-sm font-semibold text-gray-700">{label}</Label>}
      
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
          dragActive 
            ? "border-blue-500 bg-blue-50 scale-[1.02]" 
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && totalFiles < maxFiles && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled || totalFiles >= maxFiles}
          accept={allowedTypes.join(',')}
        />

        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2 pointer-events-none" />
        <p className="text-sm text-gray-600 mb-1 pointer-events-none">
          {dragActive ? "วางไฟล์ที่นี่" : "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์"}
        </p>
        <p className="text-xs text-gray-500 mb-3 pointer-events-none">
          รองรับไฟล์: PDF, Word, Excel, Adobe, CAD, รูปภาพ (สูงสุด {maxSizePerFile}MB/ไฟล์)
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={disabled || totalFiles >= maxFiles}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          เลือกไฟล์
        </Button>
        <p className="text-xs text-gray-500 mt-2 pointer-events-none">
          {totalFiles} / {maxFiles} ไฟล์
        </p>
        {pendingFiles.length > 0 && (
          <p className="text-xs text-orange-600 mt-1 pointer-events-none font-medium">
            ({pendingFiles.length} ไฟล์เลือกแล้ว - กดบันทึกเพื่ออัปโหลด)
          </p>
        )}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">กำลังอัปโหลด...</Label>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{fileName}</span>
                <span className="text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          ))}
        </div>
      )}

      {/* Pending Files (not yet uploaded) */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-orange-700">
            ไฟล์ที่เลือกแล้ว ({pendingFiles.length})
          </Label>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
            <p className="text-xs text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>กดปุ่ม "บันทึก" เพื่ออัปโหลดไฟล์และบันทึกข้อมูล</span>
            </p>
          </div>
          <div className="space-y-2">
            {pendingFiles.map((pendingFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-orange-600">
                    {getFileIcon(pendingFile.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {pendingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(pendingFile.file.size)} • ยังไม่ได้อัปโหลด
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePendingFile(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-green-700">
            ไฟล์ที่อัปโหลดแล้ว ({value.length})
          </Label>
          <div className="space-y-2">
            {value.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-green-600">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • อัปโหลดแล้ว
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadedFile(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MultiFileUpload.displayName = 'MultiFileUpload';

export default MultiFileUpload;

