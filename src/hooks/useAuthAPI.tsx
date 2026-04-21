import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/useToast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear any stored credentials if session is invalid
          if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
            localStorage.removeItem('saved_email');
            localStorage.removeItem('saved_password');
            localStorage.removeItem('remember_me');
            await supabase.auth.signOut();
          }
        }
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
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
  
          // Clear saved credentials on sign out
          localStorage.removeItem('saved_email');
          localStorage.removeItem('saved_password');
          localStorage.removeItem('remember_me');
          
          // Ensure local state is cleared
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
  
        }
        
        if (event === 'SIGNED_IN') {
  
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    // Prevent multiple simultaneous sign out attempts
    if (signingOut) {
  
      return;
    }

    setSigningOut(true);
    
    try {
  
      
      // Check if session exists before attempting to sign out
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {

        // Clear saved credentials
        localStorage.removeItem('saved_email');
        localStorage.removeItem('saved_password');
        localStorage.removeItem('remember_me');
        
        // Clear local state
        setSession(null);
        setUser(null);
        return;
      }

      // Clear saved credentials first
      localStorage.removeItem('saved_email');
      localStorage.removeItem('saved_password');
      localStorage.removeItem('remember_me');

      // Call Supabase signOut BEFORE clearing local state
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        
        // Handle specific error types
        if (error.message && (
          error.message.includes('Auth session missing') ||
          error.message.includes('AuthSessionMissingError') ||
          error.message.includes('403')
        )) {

        } else {
          console.error('❌ Unexpected sign out error:', error);
        }
      } else {

      }
      
      // Clear local state AFTER API call
      setSession(null);
      setUser(null);
      
    } catch (error: any) {
      console.error('❌ Sign out exception:', error);
      
      // Handle AuthSessionMissingError specifically
      if (error.message && error.message.includes('Auth session missing')) {

      } else {
        console.error('❌ Unexpected sign out exception:', error);
      }
      
      // Force clear local state even if there's an error
      setSession(null);
      setUser(null);
    } finally {
      setSigningOut(false);
    }
  };

  return {
    user,
    session,
    loading,
    signingOut,
    signOut
  };
};
