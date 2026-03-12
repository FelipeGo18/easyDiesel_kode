import { createContext } from 'react';
import type { AuthenticatedUser } from '@/types';

export interface UpdateProfileData {
    nombre?: string;
    email?: string;
    password?: string;
}

export interface AuthContextType {
    user: AuthenticatedUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    oauthError: string | null;
    login: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, nombre: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    updateProfile: (data: UpdateProfileData) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);