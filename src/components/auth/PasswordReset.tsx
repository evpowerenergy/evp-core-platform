
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface PasswordResetProps {
  onBackToLogin: () => void;
}

const PasswordReset = ({ onBackToLogin }: PasswordResetProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "กรุณากรอกอีเมล",
        description: "กรุณากรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      
      if (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "ส่งอีเมลสำเร็จ! 📧",
          description: "กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/80 px-8 py-12 rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">ตรวจสอบอีเมลของคุณ</CardTitle>
          <CardDescription className="text-gray-600">
            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง {email} แล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Mail className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-6">
              กรุณาตรวจสอบกล่องจดหมายและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
            </p>
          </div>
          
          <Button 
            onClick={onBackToLogin}
            variant="outline"
            className="w-full h-12 text-base border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/80 px-8 py-12 rounded-3xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">รีเซ็ตรหัสผ่าน</CardTitle>
        <CardDescription className="text-gray-600">
          กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>อีเมล</span>
            </Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 text-base border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-400/60 bg-white/90 rounded-xl shadow-sm transition-all"
              disabled={loading}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl tracking-wide hover:scale-105 active:scale-100"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังส่งอีเมล...</span>
              </div>
            ) : (
              "ส่งลิงก์รีเซ็ตรหัสผ่าน"
            )}
          </Button>

          <Button 
            type="button"
            onClick={onBackToLogin}
            variant="ghost"
            className="w-full h-12 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordReset;
