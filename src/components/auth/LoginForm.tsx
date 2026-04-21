
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User2 } from "lucide-react";
import { useAuthActions } from "@/hooks/useAuthActions";
import CompanyLogo from "@/components/CompanyLogo";
import LoginLogo from "@/components/LoginLogo";

interface LoginFormProps {
  onShowPasswordReset: () => void;
}

const LoginForm = ({ onShowPasswordReset }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { handleSignIn, loading } = useAuthActions();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSignIn(email, password, rememberMe);
  };

  return (
    <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/80 px-8 py-12 rounded-3xl">
      {/* Logo & Company Name */}
      <div className="flex flex-col items-center mb-8">
        <LoginLogo className="mb-4" />
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2 tracking-tight text-center drop-shadow-sm leading-relaxed pb-1 min-h-[2.8rem]">
          EV Power Energy
        </h1>
        <div className="flex items-center justify-center mb-1">
          {/* <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-base shadow-sm">
            <User2 className="w-5 h-5" /> CRM System
          </span> */}
        </div>
        <p className="text-lg text-gray-700 font-medium text-center mb-1">ระบบจัดการลูกค้าสัมพันธ์สำหรับธุรกิจพลังงานสะอาด</p>
      </div>

      {/* Login Form */}
      <form onSubmit={onSubmit} className="space-y-7">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>อีเมล</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 text-base border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-400/60 bg-white/90 rounded-xl shadow-sm transition-all"
            disabled={loading}
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>รหัสผ่าน</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 text-base pr-12 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-400/60 bg-white/90 rounded-xl shadow-sm transition-all"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-green-100 rounded-lg transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={loading}
              className="border-gray-300 w-5 h-5 accent-green-500 rounded-md focus:ring-2 focus:ring-green-400/60 transition-all"
            />
            <Label 
              htmlFor="remember" 
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              จดจำข้อมูลการเข้าสู่ระบบ
            </Label>
          </div>
          
          <button
            type="button"
            onClick={onShowPasswordReset}
            className="text-sm text-green-600 hover:text-green-700 underline"
            disabled={loading}
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl tracking-wide hover:scale-105 active:scale-100"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>กำลังเข้าสู่ระบบ...</span>
            </div>
          ) : (
            "เข้าสู่ระบบ"
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center mt-10 space-y-1">
        <p className="text-xs text-gray-400">
          ระบบจัดการลูกค้าสัมพันธ์สำหรับธุรกิจพลังงานสะอาด
        </p>
      </div>
    </Card>
  );
};

export default LoginForm;
