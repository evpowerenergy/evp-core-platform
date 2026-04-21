
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/useToast";

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check URL parameters first
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle URL errors
        if (error) {
          if (error === 'access_denied' && errorDescription?.includes('expired')) {
            toast({
              title: "ลิงก์หมดอายุแล้ว",
              description: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่",
              variant: "destructive",
            });
          } else {
            toast({
              title: "เกิดข้อผิดพลาด",
              description: errorDescription || "เกิดข้อผิดพลาดในการดำเนินการ",
              variant: "destructive",
            });
          }
          
          // Clear URL parameters after showing error
          setSearchParams({});
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (sessionError.message.includes('refresh_token_not_found') || sessionError.message.includes('Invalid Refresh Token')) {
            localStorage.removeItem('saved_email');
            localStorage.removeItem('saved_password');
            localStorage.removeItem('remember_me');
            await supabase.auth.signOut();
          }
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Check if this is a password recovery flow
          if (type === 'recovery' && initialSession) {
    
            setShowPasswordUpdate(true);
            // อย่าลบ type ออกจาก URL ทันที ให้ลบหลังจากเปลี่ยนรหัสผ่านสำเร็จ
          } else if (initialSession && !type && !showPasswordUpdate) {
            // Normal login, redirect to backoffice (กัน redirect ผิดใน recovery flow)
            navigate('/backoffice');
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('saved_email');
          localStorage.removeItem('saved_password');
          localStorage.removeItem('remember_me');
          setShowPasswordUpdate(false);
        }
        
        if (event === 'TOKEN_REFRESHED') {
  
        }
        
        if (event === 'SIGNED_IN') {
  
          // Only redirect if not in password recovery mode
          if (!showPasswordUpdate && !searchParams.get('type')) {
            navigate('/backoffice');
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, setSearchParams, showPasswordUpdate, toast]);

  return {
    user,
    session,
    loading,
    showPasswordUpdate
  };
};
