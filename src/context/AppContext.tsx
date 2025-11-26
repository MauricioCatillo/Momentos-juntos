import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, signInWithEmail, signUpWithEmail, signOut } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface Milestone {
    id: string;
    title: string;
    date: string;
    description: string;
    image?: string;
    location?: { lat: number; lng: number; name: string };
}

interface AppState {
    user: User | null;
    session: Session | null;
    anniversaryDate: string;
    milestones: Milestone[];
    moods: { date: string; mood: 'happy' | 'sad' | 'neutral' | 'excited' | 'tired' }[];
    bucketList: { id: string; text: string; completed: boolean }[];
    coupons: { id: string; title: string; redeemed: boolean }[];
}

interface AppContextType extends AppState {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    addMilestone: (milestone: Milestone) => void;
    addMood: (mood: 'happy' | 'sad' | 'neutral' | 'excited' | 'tired') => void;
    toggleBucketItem: (id: string) => void;
    addBucketItem: (text: string) => void;
    redeemCoupon: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        user: null,
        session: null,
        anniversaryDate: '2023-01-01', // Default
        milestones: [],
        moods: [],
        bucketList: [
            { id: '1', text: 'Ver una aurora boreal', completed: false },
            { id: '2', text: 'Cocinar pasta casera juntos', completed: false },
        ],
        coupons: [
            { id: '1', title: 'Vale por un masaje de 15 min', redeemed: false },
            { id: '2', title: 'Vale por elegir la película', redeemed: false },
            { id: '3', title: 'Vale por una cena romántica', redeemed: false },
        ],
    });

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const login = async (email: string, password: string) => {
        await signInWithEmail(email, password);
    };

    const signup = async (email: string, password: string) => {
        await signUpWithEmail(email, password);
    };

    const logout = async () => {
        await signOut();
        setState((prev) => ({ ...prev, user: null, session: null }));
    };

    const addMilestone = (milestone: Milestone) => {
        setState((prev) => ({ ...prev, milestones: [...prev.milestones, milestone] }));
    };

    const addMood = (mood: 'happy' | 'sad' | 'neutral' | 'excited' | 'tired') => {
        setState((prev) => ({
            ...prev,
            moods: [...prev.moods, { date: new Date().toISOString(), mood }],
        }));
    };

    const toggleBucketItem = (id: string) => {
        setState((prev) => ({
            ...prev,
            bucketList: prev.bucketList.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            ),
        }));
    };

    const addBucketItem = (text: string) => {
        const newItem = { id: Date.now().toString(), text, completed: false };
        setState((prev) => ({
            ...prev,
            bucketList: [...prev.bucketList, newItem],
        }));
    };

    const redeemCoupon = (id: string) => {
        setState((prev) => ({
            ...prev,
            coupons: prev.coupons.map((coupon) =>
                coupon.id === id ? { ...coupon, redeemed: true } : coupon
            ),
        }));
    };

    return (
        <AppContext.Provider
            value={{
                ...state,
                theme,
                toggleTheme,
                login,
                signup,
                logout,
                addMilestone,
                addMood,
                toggleBucketItem,
                addBucketItem,
                redeemCoupon,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
