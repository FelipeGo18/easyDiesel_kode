import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { supabase } from '../utils/supabase';
import type { ApiResponse, AuthenticatedUser } from '@/types';
import { getErrorMessage } from '@/lib/http';
import { AuthContext } from '@/context/AuthContextContext';
import type { UpdateProfileData } from '@/context/AuthContextContext';

const REFRESH_TOKEN_KEY = 'refreshToken';

function requireResponseData<T>(data: T | undefined, message: string): T {
    if (!data) {
        throw new Error(message);
    }

    return data;
}

function persistSession(token: string, refreshToken: string, user: AuthenticatedUser, setToken: (value: string) => void, setUser: (value: AuthenticatedUser) => void) {
    localStorage.setItem('token', token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setToken(token);
    setUser(user);
}

function clearSession(setToken: (value: null) => void, setUser: (value: null) => void) {
    localStorage.removeItem('token');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('token')
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isSyncing = false;

        const syncWithBackend = async (accessToken: string) => {
            if (isSyncing) return;
            isSyncing = true;
            setIsLoading(true);

            try {
                console.log('Sincronizando sesión OAuth con el backend...');
                const response = await api.post<ApiResponse<{ token: string; refreshToken: string; usuario: AuthenticatedUser }>>('/auth/supabase-login', {
                    access_token: accessToken
                });
                const payload = requireResponseData(response.data.data, 'No se pudo sincronizar la sesión con el backend');
                
                persistSession(payload.token, payload.refreshToken, payload.usuario, setToken, setUser);
                console.log('Sincronización exitosa.');

                // Limpiar el hash de la URL
                if (window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname);
                }

                // Cerrar sesión en Supabase (ya tenemos nuestro propio JWT)
                await supabase.auth.signOut();
            } catch (error) {
                console.error('Error en la sincronización OAuth:', getErrorMessage(error));
                clearSession(setToken, setUser);
            } finally {
                setIsLoading(false);
                isSyncing = false;
            }
        };

        const initAuth = async () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                try {
                    const response = await api.get<ApiResponse<AuthenticatedUser>>('/auth/me');
                    setUser(requireResponseData(response.data.data, 'No se pudo obtener el perfil del usuario'));
                } catch {
                    clearSession(setToken, setUser);
                }
            }

            // Solo quitar el loading si no estamos esperando un redirect de OAuth
            const hasOAuthHash = window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery');
            if (!hasOAuthHash) {
                setIsLoading(false);
            }
        };

        initAuth();

        // Escuchar cambios en la autenticación de Supabase (OAuth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Supabase Auth Event: ${event}`, !!session);
            
            if (session?.access_token && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
                await syncWithBackend(session.access_token);
            } else if (event === 'INITIAL_SESSION' && !session) {
                // Si no hay sesión inicial y no hay hash, terminar carga
                const hasHash = window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery');
                if (!hasHash) {
                    setIsLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                // Si cerramos sesión en Supabase pero NO tenemos sesión en nuestro backend, limpiar todo
                if (!localStorage.getItem('token')) {
                    clearSession(setToken, setUser);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        // Primero intentar login tradicional en el backend
        try {
            const response = await api.post<ApiResponse<{ token: string; refreshToken: string; usuario: AuthenticatedUser }>>('/auth/login', { email, password });
            const payload = requireResponseData(response.data.data, 'No se recibió la sesión del backend');
            const { token: newToken, refreshToken, usuario: userData } = payload;
            persistSession(newToken, refreshToken, userData, setToken, setUser);
        } catch (error: unknown) {
            // Si falla el backend, intentar con Supabase por si el usuario se registró allí
            const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (supabaseError) throw supabaseError;

            if (data.session?.access_token) {
                // Si Supabase tuvo éxito, sincronizar con el backend
                const response = await api.post<ApiResponse<{ token: string; refreshToken: string; usuario: AuthenticatedUser }>>('/auth/supabase-login', {
                    access_token: data.session.access_token
                });
                const payload = requireResponseData(response.data.data, 'No se recibió la sesión de Supabase');
                const { token: newToken, refreshToken, usuario: userData } = payload;
                persistSession(newToken, refreshToken, userData, setToken, setUser);
                await supabase.auth.signOut();
            } else {
                throw error;
            }
        }
    };

    const registerWithEmail = async (email: string, password: string, nombre: string) => {
        // 1. Registrar en Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: nombre,
                },
                emailRedirectTo: window.location.origin + '/login',
            },
        });

        if (error) throw error;

        // Nota: El usuario debe confirmar su correo antes de poder sincronizar con el backend
        // a menos que la confirmación de email esté desactivada en Supabase.
        if (data.session?.access_token) {
            const response = await api.post<ApiResponse<{ token: string; refreshToken: string; usuario: AuthenticatedUser }>>('/auth/supabase-login', {
                access_token: data.session.access_token
            });
            const payload = requireResponseData(response.data.data, 'No se recibió la sesión del backend');
            const { token: newToken, refreshToken, usuario: userData } = payload;
            persistSession(newToken, refreshToken, userData, setToken, setUser);
            await supabase.auth.signOut();
        }
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/login',
            },
        });

        if (error) throw error;
    };

    const logout = () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (refreshToken) {
            api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => undefined);
        }

        clearSession(setToken, setUser);
    };

    const updateProfile = async (data: UpdateProfileData) => {
        const response = await api.put<ApiResponse<AuthenticatedUser>>('/auth/me', data);
        const updated = requireResponseData(response.data.data, 'No se pudo actualizar el perfil');
        setUser(updated);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                registerWithEmail,
                loginWithGoogle,
                logout,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

