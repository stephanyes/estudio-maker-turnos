'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Tipo para el perfil de usuario completo
export type UserProfile = {
  id: string;
  business_id: string;
  role: 'admin' | 'staff';
  name: string;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role?: 'admin' | 'staff') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil de usuario desde la base de datos
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await loadUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  // Inicializar sesión al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          setUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
          const profile = await loadUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'staff' = 'admin') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };

      // NO crear el perfil aquí inmediatamente
      // Supabase requiere confirmación de email primero
      
      if (data.user && !data.session) {
        // Usuario creado pero necesita confirmar email
        return { 
          error: null, 
          message: 'Revisa tu email para confirmar la cuenta antes de continuar.' 
        };
      }

      // Si hay sesión inmediata (email auto-confirmado en desarrollo)
      if (data.user && data.session) {
        await createUserProfile(data.user.id, name, role);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Nueva función helper
  const createUserProfile = async (userId: string, name: string, role: 'admin' | 'staff') => {
    const businessId = '550e8400-e29b-41d4-a716-446655440000';
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        business_id: businessId,
        role,
        name,
      }]);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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

// 🎯 Hook para manejar permisos basados en roles
export const usePermissions = () => {
  const { userProfile } = useAuth();
  
  const isAdmin = userProfile?.role === 'admin';
  const isStaff = userProfile?.role === 'staff';
  
  const permissions = {
    // 👑 Solo admin
    canManageStaff: isAdmin,
    canViewStats: isAdmin,
    canViewTraffic: isAdmin,
    canViewTiming: isAdmin,
    canExportData: isAdmin,
    canImportData: isAdmin,
    canResetData: isAdmin,
    canAccessDev: isAdmin,
    
    // 👥 Admin y Staff pueden gestionar precios
    canManagePrices: true, // Cambiado: Staff también puede ver/gestionar precios
    
    // 👥 Admin y Staff
    canViewWeek: true, // Todos pueden ver el calendario
    canCreateAppointments: true,
    canEditAppointments: true,
    canViewClients: true,
    canCreateClients: true,
    canViewDaily: true,
    canViewFollowUp: true,
    
    // 🔒 Staff limitado
    canOnlyEditOwnAppointments: isStaff, // Staff solo puede editar sus propias citas
  };
  
  return {
    ...permissions,
    isAdmin,
    isStaff,
    role: userProfile?.role
  };
};