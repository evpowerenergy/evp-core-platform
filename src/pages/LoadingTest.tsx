import React, { useState } from 'react';
import { CompleteExample } from '@/examples/LoadingExamples';
import { CompleteEnhancedExample } from '@/examples/EnhancedLoadingExamples';
import { CompleteElectricityExample } from '@/examples/ElectricityLoadingExamples';
import { LottieFileTest } from '@/examples/LottieFileTest';
import { SizeTestExample } from '@/examples/SizeTestExample';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LoadingTest = () => {
  const [showExamples, setShowExamples] = useState(false);
  const [showEnhancedExamples, setShowEnhancedExamples] = useState(false);
  const [showElectricityExamples, setShowElectricityExamples] = useState(false);
  const [showLottieTest, setShowLottieTest] = useState(false);
  const [showSizeTest, setShowSizeTest] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 ทดสอบระบบ Loading State
          </h1>
          <p className="text-gray-600 mb-6">
            หน้านี้ใช้สำหรับทดสอบระบบ loading state ใหม่ที่สร้างขึ้น
          </p>
          
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={() => setShowExamples(!showExamples)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {showExamples ? 'ซ่อน' : 'แสดง'} ตัวอย่างพื้นฐาน
            </Button>
            <Button 
              onClick={() => setShowEnhancedExamples(!showEnhancedExamples)}
              className="bg-green-600 hover:bg-green-700"
            >
              {showEnhancedExamples ? 'ซ่อน' : 'แสดง'} ตัวอย่าง Enhanced (Lottie)
            </Button>
            <Button 
              onClick={() => setShowElectricityExamples(!showElectricityExamples)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {showElectricityExamples ? 'ซ่อน' : 'แสดง'} ตัวอย่าง Electricity (Custom Lottie)
            </Button>
            <Button 
              onClick={() => setShowLottieTest(!showLottieTest)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {showLottieTest ? 'ซ่อน' : 'แสดง'} ทดสอบไฟล์ Lottie
            </Button>
            <Button 
              onClick={() => setShowSizeTest(!showSizeTest)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {showSizeTest ? 'ซ่อน' : 'แสดง'} ทดสอบขนาด
            </Button>
            <Button 
              onClick={() => window.location.href = '/lead-management'}
              variant="outline"
            >
              ไปหน้า Dashboard
            </Button>
          </div>
        </div>

        {showExamples && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ตัวอย่างการใช้งานระบบ Loading พื้นฐาน</CardTitle>
            </CardHeader>
            <CardContent>
              <CompleteExample />
            </CardContent>
          </Card>
        )}

        {showEnhancedExamples && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ตัวอย่างการใช้งานระบบ Enhanced Loading (Lottie)</CardTitle>
            </CardHeader>
            <CardContent>
              <CompleteEnhancedExample />
            </CardContent>
          </Card>
        )}

        {showElectricityExamples && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ตัวอย่างการใช้งานระบบ Electricity Loading (Custom Lottie)</CardTitle>
            </CardHeader>
            <CardContent>
              <CompleteElectricityExample />
            </CardContent>
          </Card>
        )}

        {showLottieTest && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ทดสอบไฟล์ Lottie Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <LottieFileTest />
            </CardContent>
          </Card>
        )}

        {showSizeTest && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ทดสอบขนาด Lottie Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <SizeTestExample />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📋 วิธีการทดสอบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ ระบบที่พร้อมใช้งาน</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• LoadingSpinner - สำหรับ spinner ทั่วไป</li>
                  <li>• LoadingOverlay - สำหรับ overlay loading</li>
                  <li>• PageLoading - สำหรับ loading ทั้งหน้า</li>
                  <li>• Skeleton Components - สำหรับ skeleton loading</li>
                  <li>• useLoadingState Hook - สำหรับจัดการ loading state</li>
                  <li>• useMultipleLoadingStates Hook - สำหรับ multiple states</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🔄 ขั้นตอนการทดสอบ</h4>
                <ol className="text-sm space-y-1 text-gray-600 list-decimal list-inside">
                  <li>คลิก "แสดงตัวอย่างการใช้งาน" เพื่อดูการทำงาน</li>
                  <li>ทดสอบปุ่มต่างๆ ในตัวอย่าง</li>
                  <li>ไปหน้า Dashboard เพื่อดูการใช้งานจริง</li>
                  <li>ทดสอบการโหลดข้อมูลในหน้าเดิม</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 ข้อดีของระบบใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">⚡ ประสิทธิภาพสูง</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Skeleton loading แทน blank screen</li>
                  <li>• Progressive loading แบบค่อยเป็นค่อยไป</li>
                  <li>• Smart delay และ minimum duration</li>
                  <li>• Multiple loading states รองรับ</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">🎨 ใช้งานง่าย</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• API ที่เข้าใจง่าย</li>
                  <li>• TypeScript support เต็มรูปแบบ</li>
                  <li>• Pre-built components พร้อมใช้</li>
                  <li>• Customizable ได้ทุกส่วน</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ หมายเหตุ</h4>
          <p className="text-sm text-yellow-700">
            ระบบ loading ใหม่นี้จะแทนที่ระบบเดิมในทุกหน้า เพื่อให้มีประสิทธิภาพสูงสุดและสอดคล้องกันทั้งระบบ
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingTest;
