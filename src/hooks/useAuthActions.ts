
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);

    try {
  
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Save credentials if remember me is checked
      if (rememberMe) {

        localStorage.setItem('saved_email', email);
        localStorage.setItem('saved_password', password);
        localStorage.setItem('remember_me', 'true');
      } else {

        localStorage.removeItem('saved_email');
        localStorage.removeItem('saved_password');
        localStorage.removeItem('remember_me');
      }

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับสู่ระบบ CRM",
      });
      
      // Redirect to backoffice after successful login
      navigate('/backoffice');
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      
      if (error.message === 'Invalid login credentials') {
        errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (error.message.includes('refresh_token_not_found')) {
        errorMessage = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
        localStorage.removeItem('saved_email');
        localStorage.removeItem('saved_password');
        localStorage.removeItem('remember_me');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('saved_email');
      localStorage.removeItem('saved_password');
      localStorage.removeItem('remember_me');

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      window.location.replace('/auth');
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  return {
    handleSignIn,
    signOut,
    loading
  };
};
