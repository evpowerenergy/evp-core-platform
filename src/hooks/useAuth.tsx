import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/useToast";
import { SUPABASE_URL } from "@/config";
import { getCachedSession, setCachedSession, clearCachedSession } from "@/utils/sessionCache";

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
        // ✅ ใช้ cached session ก่อนเพื่อลดการเรียก API
        const cached = getCachedSession();
        if (cached) {
          if (mounted) {
            setSession(cached);
            setUser(cached.user ?? null);
            setLoading(false);
          }
          // Still fetch fresh session in background (but don't block)
          supabase.auth.getSession().then(({ data, error }) => {
            if (!error && data?.session) {
              setCachedSession(data.session);
              if (mounted) {
                setSession(data.session);
                setUser(data.session.user ?? null);
              }
            }
          }).catch(() => {
            // Ignore background fetch errors
          });
          return;
        }

        // Get initial session with retry logic for rate limiting
        let retries = 0;
        const maxRetries = 3;
        let initialSession = null;
        let error = null;

        while (retries < maxRetries) {
          try {
            const result = await supabase.auth.getSession();
            initialSession = result.data?.session ?? null;
            error = result.error;
            
            // Cache successful session
            if (initialSession && !error) {
              setCachedSession(initialSession);
            }
            
            // If successful or not a rate limit error, break
            if (!error || (!error.message?.includes('rate limit') && error.status !== 429)) {
              break;
            }

            // If rate limited, wait before retrying (exponential backoff)
            if (error?.status === 429 || error?.message?.includes('rate limit')) {
              const waitTime = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
              console.warn(`Rate limited, retrying in ${waitTime}ms... (attempt ${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }

            break;
          } catch (err: any) {
            error = err;
            if (err?.status === 429 || err?.message?.includes('rate limit')) {
              const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
              console.warn(`Rate limited, retrying in ${waitTime}ms... (attempt ${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }
            break;
          }
        }
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear any stored credentials if session is invalid
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            localStorage.removeItem('saved_email');
            localStorage.removeItem('saved_password');
            localStorage.removeItem('remember_me');
            clearCachedSession();
            await supabase.auth.signOut();
          }
          // If rate limited after retries, use cached session if available
          if (error.status === 429 || error.message?.includes('rate limit')) {
            console.warn('Rate limit reached after retries. Using cached session if available.');
            const cached = getCachedSession();
            if (cached) {
              initialSession = cached;
            } else {
              // Try to get session from localStorage as fallback
              try {
                const supabaseKey = SUPABASE_URL.split('//')[1]?.split('.')[0] || 'supabase';
                const cachedSession = localStorage.getItem(`sb-${supabaseKey}-auth-token`);
                if (cachedSession) {
                  const parsed = JSON.parse(cachedSession);
                  if (parsed?.currentSession) {
                    initialSession = parsed.currentSession;
                    setCachedSession(initialSession);
                  }
                }
              } catch (e) {
                // Ignore cache errors
              }
            }
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

        // ✅ Cache session when it changes
        if (session) {
          setCachedSession(session);
        } else {
          clearCachedSession();
        }

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
  
          // Clear saved credentials on sign out
          localStorage.removeItem('saved_email');
          localStorage.removeItem('saved_password');
          localStorage.removeItem('remember_me');
          clearCachedSession();
          
          // Ensure local state is cleared
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // ✅ Cache refreshed session
          if (session) {
            setCachedSession(session);
          }
        }
        
        if (event === 'SIGNED_IN') {
          // ✅ Cache new session
          if (session) {
            setCachedSession(session);
          }
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
      clearCachedSession();

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
