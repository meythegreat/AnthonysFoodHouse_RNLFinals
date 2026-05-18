import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from '../services/axiosConfig.ts';

// --- Types ---
export type UserRole = 'Manager' | 'Assistant' | 'Cashier';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    hasRole: (allowedRoles: UserRole[]) => boolean;
}

// --- Context Initialization ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is already logged in on initial load
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Laravel Sanctum endpoint to get current authenticated user
                const response = await axios.get('/api/user'); 
                setUser(response.data);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    // Helper functions for your UI components
    const isAuthenticated = !!user;
    const hasRole = (allowedRoles: UserRole[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};