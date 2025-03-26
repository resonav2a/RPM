import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    setIsLoading(true);
    
    // Get the site URL from environment variable or use window.location.origin
    // In production, always prefer the VITE_PUBLIC_URL environment variable
    let siteUrl = '';
    
    // Check if we're in a production environment (Netlify)
    if (import.meta.env.PROD) {
      siteUrl = import.meta.env.VITE_PUBLIC_URL;
      console.log('Using production URL for redirect:', siteUrl);
    } else {
      // For local development, use the current origin
      siteUrl = window.location.origin;
      console.log('Using development URL for redirect:', siteUrl);
    }
    
    // For deployed sites, ensure it's using https
    const secureRedirectUrl = siteUrl.replace('http://', 'https://');
    
    console.log('Final auth redirect URL:', secureRedirectUrl);
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: secureRedirectUrl,
      }
    });
    
    if (error) throw error;
    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}