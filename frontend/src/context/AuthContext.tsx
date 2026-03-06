import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { supabase } from '../utils/supabase';

interface User {
    id: string;
    email: string;
    nombre: string;
    rol: string | { id: string; nombre: string; descripcion?: string; permisos?: string[] };
    fotoUrl?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, nombre: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('token')
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data.data);
                } catch {
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();

        // Escuchar cambios en la autenticación de Supabase (OAuth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.access_token) {
                setIsLoading(true);
                try {
                    // Intercambiar el token de Supabase por uno de nuestro backend
                    const response = await api.post('/auth/supabase-login', {
                        access_token: session.access_token
                    });
                    const { token: newToken, user: userData } = response.data.data;
                    localStorage.setItem('token', newToken);
                    setToken(newToken);
                    setUser(userData);
                    
                    // Limpiar la sesión de Supabase para evitar confusiones
                    await supabase.auth.signOut();
                } catch (error) {
                    console.error('Error al sincronizar con el backend:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [token]);

    const login = async (email: string, password: string) => {
        // Primero intentar login tradicional en el backend
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token: newToken, user: userData } = response.data.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
        } catch (error: any) {
            // Si falla el backend, intentar con Supabase por si el usuario se registró allí
            const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (supabaseError) throw supabaseError;

            if (data.session?.access_token) {
                // Si Supabase tuvo éxito, sincronizar con el backend
                const response = await api.post('/auth/supabase-login', {
                    access_token: data.session.access_token
                });
                const { token: newToken, user: userData } = response.data.data;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(userData);
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
            const response = await api.post('/auth/supabase-login', {
                access_token: data.session.access_token
            });
            const { token: newToken, user: userData } = response.data.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
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
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
