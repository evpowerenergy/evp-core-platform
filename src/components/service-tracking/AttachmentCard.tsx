import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  File,
  Download,
  Paperclip
} from "lucide-react";

interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface AttachmentCardProps {
  attachments: FileAttachment[];
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachments }) => {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="h-5 w-5 text-green-600" />;
    if (type.includes('cad') || type.includes('dwg') || type.includes('dxf')) return <FileCode className="h-5 w-5 text-purple-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'ไม่ระบุ';
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <Paperclip className="h-5 w-5" />
          เอกสารแนบ ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-indigo-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">
                      {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(file.url, file.name)}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex-shrink-0 ml-3"
              >
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttachmentCard;
