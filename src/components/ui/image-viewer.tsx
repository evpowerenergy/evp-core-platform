import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  title?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title = "ดูรูปภาพ"
}) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;
  
     return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
         <DialogTitle className="sr-only">{title}</DialogTitle>
         <div className="relative">
           {/* Header */}
           <div className="flex items-center justify-between p-4 border-b">
             <h3 className="text-lg font-semibold">{title}</h3>
           </div>
           
                     {/* Image Container */}
           <div className="flex items-center justify-center p-4 min-h-[400px]">
             {!hasError ? (
               <img
                 src={imageSrc}
                 alt={imageAlt}
                 className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                 onError={(e) => {
                   console.error('Failed to load image:', imageSrc);
                   setHasError(true);
                   // Check if it's a Facebook CDN URL
                   if (imageSrc.includes('fbcdn.net') || imageSrc.includes('facebook.com')) {
                     setErrorMessage('รูปภาพจาก Facebook CDN หมดอายุแล้ว (403 Forbidden)');
                   } else {
                     setErrorMessage('ไม่สามารถโหลดรูปภาพได้');
                   }
                 }}
               />
             ) : (
               <div className="flex flex-col items-center justify-center p-8 text-center">
                 <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                 <p className="text-gray-600 text-lg font-medium mb-2">
                   {errorMessage || 'ไม่สามารถโหลดรูปภาพได้'}
                 </p>
                 <p className="text-gray-400 text-sm">
                   URL: {imageSrc.substring(0, 80)}...
                 </p>
               </div>
             )}
           </div>
           
                     {/* Footer */}
           <div className="p-4 border-t">
             <div className="text-center">
               <Button
                 variant="outline"
                 onClick={onClose}
                 className="w-full"
               >
                 ปิด
               </Button>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;