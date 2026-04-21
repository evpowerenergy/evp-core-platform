
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SalesTeamHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-green-100/50 p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/30"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-200/20 to-transparent rounded-full -mr-16 -mt-16"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            onClick={() => navigate('/lead-management')}
            size="sm"
            className="hover:bg-green-50 border-green-200 text-green-700 hover:border-green-300 transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                จัดการทีมขาย
              </h1>
              <p className="text-gray-600 mt-2 text-lg">ภาพรวมและการวิเคราะห์ผลงานทีมขายที่ครอบคลุม</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
            <span className="text-sm font-semibold text-green-700">อัพเดทล่าสุด: วันนี้</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTeamHeader;
