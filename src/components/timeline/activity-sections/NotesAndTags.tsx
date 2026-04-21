import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface NotesAndTagsProps {
  note: string | null;
}

const NotesAndTags = ({ note }: NotesAndTagsProps) => {
  return (
    <div className="space-y-4">
      {/* Note */}
      {note && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">รายละเอียดการติดตาม</span>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-blue-100 text-sm leading-relaxed">
                  {note}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotesAndTags;
