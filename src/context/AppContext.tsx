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
    loading: boolean;
    anniversaryDate: string;
    milestones: Milestone[];
    moods: { id: string; date: string; mood: string; note?: string }[];
    bucketList: { id: string; text: string; completed: boolean }[];
    coupons: { id: string; title: string; redeemed: boolean }[];
}

interface AppContextType extends AppState {
    theme: 'light' | 'dark';
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    addMilestone: (milestone: Milestone) => void;
    addMood: (mood: string) => Promise<void>;
    toggleBucketItem: (id: string) => void;
    addBucketItem: (text: string) => void;
    redeemCoupon: (id: string) => void;
    addCoupon: (title: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        user: null,
        session: null,
        loading: true,
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

    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState((prev) => ({ ...prev, session, user: session?.user ?? null, loading: false }));
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState((prev) => {
                // Only update if session actually changed to prevent loops
                if (prev.session?.access_token === session?.access_token) return prev;
                return { ...prev, session, user: session?.user ?? null };
            });
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load persisted data and theme on mount
    useEffect(() => {
        // Theme
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }

        // Local Data Persistence
        try {
            const savedBucket = localStorage.getItem('bucketList');
            const savedCoupons = localStorage.getItem('coupons');
            const savedMilestones = localStorage.getItem('milestones');

            setState(prev => ({
                ...prev,
                bucketList: savedBucket ? JSON.parse(savedBucket) : prev.bucketList,
                coupons: savedCoupons ? JSON.parse(savedCoupons) : prev.coupons,
                milestones: savedMilestones ? JSON.parse(savedMilestones) : prev.milestones
            }));
        } catch (e) {
            console.error('Error loading local data:', e);
        }
    }, []);

    // Fetch Moods when user changes
    useEffect(() => {
        const fetchMoods = async () => {
            if (!state.user) return;

            const { data: moodsData } = await supabase
                .from('moods')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(7);

            if (moodsData) {
                setState(prev => ({
                    ...prev,
                    moods: moodsData.map(m => ({
                        id: m.id,
                        date: m.created_at,
                        mood: m.mood,
                        note: m.note
                    }))
                }));
            }
        };

        fetchMoods();
    }, [state.user?.id]);

    // Persist data changes
    useEffect(() => {
        localStorage.setItem('bucketList', JSON.stringify(state.bucketList));
        localStorage.setItem('coupons', JSON.stringify(state.coupons));
        localStorage.setItem('milestones', JSON.stringify(state.milestones));
    }, [state.bucketList, state.coupons, state.milestones]);

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

    const addMood = async (mood: string) => {
        if (!state.user) return;

        // Optimistic update
        const tempId = 'temp-' + Date.now();
        const tempMood = {
            id: tempId,
            date: new Date().toISOString(),
            mood,
            note: ''
        };

        setState((prev) => ({
            ...prev,
            moods: [tempMood, ...prev.moods]
        }));

        try {
            const { data, error } = await supabase
                .from('moods')
                .insert([{
                    mood,
                    user_id: state.user.id
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Replace temp mood with real one
                setState((prev) => ({
                    ...prev,
                    moods: prev.moods.map(m => m.id === tempId ? {
                        id: data.id,
                        date: data.created_at,
                        mood: data.mood,
                        note: data.note
                    } : m),
                }));
            }
        } catch (error) {
            console.error('Error adding mood:', error);
            // Revert optimistic update
            setState((prev) => ({
                ...prev,
                moods: prev.moods.filter(m => m.id !== tempId)
            }));
        }
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

    const addCoupon = (title: string) => {
        const newCoupon = { id: Date.now().toString(), title, redeemed: false };
        setState((prev) => ({
            ...prev,
            coupons: [...prev.coupons, newCoupon],
        }));
    };

    return (
        <AppContext.Provider
            value={{
                ...state,
                theme,

                login,
                signup,
                logout,
                addMilestone,
                addMood,
                toggleBucketItem,
                addBucketItem,
                redeemCoupon,
                addCoupon,
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
