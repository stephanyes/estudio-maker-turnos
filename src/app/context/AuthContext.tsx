'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useData } from './DataProvider';

// Tipo para el perfil de usuario completo
export type UserProfile = {
  id: string;
  business_id: string;
  role: 'admin' | 'staff';
  name: string;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  // 🚀 ELIMINADO: userProfile - ahora se usa userProfiles del DataProvider
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role?: 'admin' | 'staff') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // 🚀 ELIMINADO: refreshProfile - ya no es necesario
  // 🆕 Nuevas funciones de administración
  createUserByAdmin: (email: string, password: string, name: string, role: 'admin' | 'staff') => Promise<{ error: any }>;
  updateUserRole: (userId: string, newRole: 'admin' | 'staff') => Promise<{ error: any }>;
  reactivateUser: (userId: string) => Promise<{ error: any }>;
  deleteUser: (userId: string) => Promise<{ error: any }>;
  getAllUsers: () => Promise<{ data: UserProfile[] | null; error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // 🚀 ELIMINADO: userProfile state - ahora se usa userProfiles del DataProvider
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 🚀 ELIMINADO: loadUserProfile y refreshProfile - ahora se usa userProfiles del DataProvider

  // Inicializar sesión al cargar la app
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // console.log('🔐 AuthContext: Iniciando inicialización de autenticación');
        
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ AuthContext: Error obteniendo sesión:', sessionError);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // console.log('🔐 AuthContext: Sesión obtenida:', !!session);
        setSession(session);

        if (session?.user) {
          // console.log('🔐 AuthContext: Usuario encontrado');
          setUser(session.user);
          // 🚀 ELIMINADO: loadUserProfile - ahora se usa userProfiles del DataProvider
        } else {
          // console.log('🔐 AuthContext: No hay usuario en sesión');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error en initializeAuth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          // console.log('🔐 AuthContext: Inicialización completada, loading=false');
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔐 AuthContext: Auth state change:', event, !!session?.user);
        
        if (!isMounted) return;
        
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
          // 🚀 ELIMINADO: loadUserProfile - ahora se usa userProfiles del DataProvider
        } else {
          setUser(null);
          // 🚀 ELIMINADO: setUserProfile - ya no existe
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
        status: 'active', // Usuario activo por defecto
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

  // 🚀 NUEVO: Hook para obtener el userProfile actual
  const getCurrentUserProfile = () => {
    // Esta función se llamará desde usePermissions
    return null; // Se implementará en usePermissions
  };

  // 🆕 Funciones de administración
  const createUserByAdmin = async (email: string, password: string, name: string, role: 'admin' | 'staff') => {
    try {
      // 🚀 TEMPORAL: Verificación de admin se hará en usePermissions
      // TODO: Implementar verificación de admin en las funciones

      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmar email para desarrollo
        user_metadata: { name, role }
      });

      if (error) return { error };

      if (data.user) {
        // Crear perfil de usuario
        await createUserProfile(data.user.id, name, role);
        return { error: null };
      }

      return { error: { message: 'Error al crear usuario' } };
    } catch (error) {
      return { error };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'staff') => {
    try {
      // 🚀 TEMPORAL: Verificación de admin se hará en usePermissions
      // TODO: Implementar verificación de admin en las funciones
      // if (userProfile?.role !== 'admin') {
      //   return { error: { message: 'Solo los administradores pueden cambiar roles' } };
      // }

      // No permitir cambiar el rol del usuario actual
      if (userId === user?.id) {
        return { error: { message: 'No puedes cambiar tu propio rol' } };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      // 🚀 TEMPORAL: Verificación de admin se hará en usePermissions
      // TODO: Implementar verificación de admin en las funciones
      // if (userProfile?.role !== 'admin') {
      //   return { error: { message: 'Solo los administradores pueden reactivar usuarios' } };
      // }

      // Reactivar usuario cambiando su status a 'active'
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) return { error };

      return { error: null };
    } catch (error) {
      console.error('Error in reactivateUser:', error);
      return { error: { message: 'Error inesperado al reactivar usuario' } };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // 🚀 TEMPORAL: Verificación de admin se hará en usePermissions
      // TODO: Implementar verificación de admin en las funciones
      // if (userProfile?.role !== 'admin') {
      //   return { error: { message: 'Solo los administradores pueden eliminar usuarios' } };
      // }

      // No permitir eliminar el usuario actual
      if (userId === user?.id) {
        return { error: { message: 'No puedes eliminar tu propia cuenta' } };
      }

      // Soft delete: marcar usuario como eliminado en lugar de eliminarlo físicamente
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ status: 'deleted' })
        .eq('id', userId);

      if (profileError) {
        console.error('Error soft deleting user profile:', profileError);
        return { error: { message: 'Error al eliminar el usuario' } };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return { error: { message: 'Error inesperado al eliminar usuario' } };
    }
  };

  const getAllUsers = async () => {
    try {
      // 🚀 TEMPORAL: Verificación de admin se hará en usePermissions
      // TODO: Implementar verificación de admin en las funciones
      // if (userProfile?.role !== 'admin') {
      //   return { data: null, error: { message: 'Solo los administradores pueden ver todos los usuarios' } };
      // }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { data: null, error };

      return { data: data as UserProfile[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    // 🚀 ELIMINADO: userProfile - ahora se usa userProfiles del DataProvider
    session,
    loading,
    signIn,
    signUp,
    signOut,
    // 🚀 ELIMINADO: refreshProfile - ya no es necesario
    // 🆕 Agregar nuevas funciones
    createUserByAdmin,
    updateUserRole,
    reactivateUser,
    deleteUser,
    getAllUsers,
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
  const { user } = useAuth();
  // 🚀 NUEVO: Obtener userProfile del DataProvider
  const { userProfiles } = useData();
  
  // Encontrar el perfil del usuario actual
  const userProfile = userProfiles?.find(profile => profile.id === user?.id);
  
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
    canAccessAdmin: isAdmin, // 🆕 Nuevo permiso para dashboard de admin
    canViewCompetitors: isAdmin, // 🆕 Nuevo permiso para precios de competencia
    
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