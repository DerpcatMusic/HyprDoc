
import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

// Adapter to maintain compatibility with existing app structure
// while using Clerk under the hood.

interface AuthContextType {
    user: any | null; // Using any for compatibility with Clerk User Resource
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();

    return (
        <AuthContext.Provider value={{ 
            user: user || null, 
            loading: !isLoaded, 
            signOut: async () => { await signOut(); }
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    
    // Mimic the original hook's return signature for minimal refactoring
    return {
        user: user || null,
        session: null, // Clerk manages sessions internally
        loading: !isLoaded,
        signOut: async () => { await signOut(); }
    };
};
