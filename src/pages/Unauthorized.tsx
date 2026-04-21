import { AlertTriangle, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">
            ไม่มีสิทธิ์เข้าถึง
          </CardTitle>
          <CardDescription className="text-gray-600">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากต้องการสิทธิ์เพิ่มเติม
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500">
            <p>หากคุณเชื่อว่านี่เป็นข้อผิดพลาด</p>
            <p>กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
          <div className="flex justify-center">
            <Button asChild className="w-full max-w-xs">
              <Link to="/backoffice">
                <Home className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 