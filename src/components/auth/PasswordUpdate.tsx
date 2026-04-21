
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

const PasswordUpdate = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่าน",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านและรหัสผ่านยืนยันให้ตรงกัน",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "รหัสผ่านสั้นเกินไป",
        description: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setUpdated(true);
        toast({
          title: "เปลี่ยนรหัสผ่านสำเร็จ! 🎉",
          description: "รหัสผ่านของคุณได้ถูกเปลี่ยนเรียบร้อยแล้ว",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Redirect to index after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
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

  if (updated) {
    return (
      <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/80 px-8 py-12 rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">เปลี่ยนรหัสผ่านสำเร็จ</CardTitle>
          <CardDescription className="text-gray-600">
            รหัสผ่านของคุณได้ถูกเปลี่ยนเรียบร้อยแล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-6">
              กำลังนำคุณไปยังหน้าแดชบอร์ด...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/80 px-8 py-12 rounded-3xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">ตั้งรหัสผ่านใหม่</CardTitle>
        <CardDescription className="text-gray-600">
          กรอกรหัสผ่านใหม่ของคุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>รหัสผ่านใหม่</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่"
                className="h-12 text-base pr-12 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-400/60 bg-white/90 rounded-xl shadow-sm transition-all"
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>ยืนยันรหัสผ่านใหม่</span>
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className="h-12 text-base pr-12 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-400/60 bg-white/90 rounded-xl shadow-sm transition-all"
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                disabled={loading}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl tracking-wide hover:scale-105 active:scale-100"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </div>
            ) : (
              "บันทึกรหัสผ่านใหม่"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordUpdate;
