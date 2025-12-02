import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, signInWithEmail, signUpWithEmail, signOut, getBucketList, getCoupons, getMilestones, addBucketItem as addBucketItemToDb, addCoupon as addCouponToDb, addMilestone as addMilestoneToDb, toggleBucketItem as toggleBucketItemInDb, redeemCoupon as redeemCouponInDb, deleteBucketItem as deleteBucketItemInDb, deleteCoupon as deleteCouponInDb } from '../supabaseClient';
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
    deleteBucketItem: (id: string) => void;
    deleteCoupon: (id: string) => void;
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
        // Theme initialization
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }

        // Dynamic Theme Listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Fetch Data when user changes
    useEffect(() => {
        const fetchData = async () => {
            if (!state.user) return;

            try {
                const [moodsData, bucketData, couponsData, milestonesData] = await Promise.all([
                    supabase.from('moods').select('*').order('created_at', { ascending: false }).limit(7),
                    getBucketList(),
                    getCoupons(),
                    getMilestones()
                ]);

                setState(prev => ({
                    ...prev,
                    moods: moodsData.data ? moodsData.data.map(m => ({
                        id: m.id,
                        date: m.created_at,
                        mood: m.mood,
                        note: m.note
                    })) : [],
                    bucketList: bucketData || [],
                    coupons: couponsData || [],
                    milestones: milestonesData || []
                }));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [state.user]);

    const login = async (email: string, password: string) => {
        await signInWithEmail(email, password);
    };

    const signup = async (email: string, password: string) => {
        await signUpWithEmail(email, password);
    };

    const logout = async () => {
        await signOut();
        setState((prev) => ({ ...prev, user: null, session: null, bucketList: [], coupons: [], milestones: [], moods: [] }));
    };

    const addMilestone = async (milestone: Milestone) => {
        try {
            const newMilestone = await addMilestoneToDb({
                title: milestone.title,
                date: milestone.date,
                description: milestone.description,
                image: milestone.image,
                location: milestone.location,
                user_id: state.user?.id
            });
            if (newMilestone) {
                setState((prev) => ({ ...prev, milestones: [...prev.milestones, newMilestone] }));
            }
        } catch (error) {
            console.error('Error adding milestone:', error);
        }
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

    const toggleBucketItem = async (id: string) => {
        const item = state.bucketList.find(i => i.id === id);
        if (!item) return;

        // Optimistic update
        setState((prev) => ({
            ...prev,
            bucketList: prev.bucketList.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            ),
        }));

        try {
            await toggleBucketItemInDb(id, !item.completed);
        } catch (error) {
            console.error('Error toggling bucket item:', error);
            // Revert
            setState((prev) => ({
                ...prev,
                bucketList: prev.bucketList.map((item) =>
                    item.id === id ? { ...item, completed: !item.completed } : item
                ),
            }));
        }
    };

    const addBucketItem = async (text: string) => {
        try {
            const newItem = await addBucketItemToDb(text);
            if (newItem) {
                setState((prev) => ({
                    ...prev,
                    bucketList: [...prev.bucketList, newItem],
                }));
            }
        } catch (error) {
            console.error('Error adding bucket item:', error);
        }
    };

    const redeemCoupon = async (id: string) => {
        // Optimistic update
        setState((prev) => ({
            ...prev,
            coupons: prev.coupons.map((coupon) =>
                coupon.id === id ? { ...coupon, redeemed: true } : coupon
            ),
        }));

        try {
            await redeemCouponInDb(id);
        } catch (error) {
            console.error('Error redeeming coupon:', error);
            // Revert
            setState((prev) => ({
                ...prev,
                coupons: prev.coupons.map((coupon) =>
                    coupon.id === id ? { ...coupon, redeemed: false } : coupon
                ),
            }));
        }
    };

    const addCoupon = async (title: string) => {
        try {
            const newCoupon = await addCouponToDb(title);
            if (newCoupon) {
                setState((prev) => ({
                    ...prev,
                    coupons: [...prev.coupons, newCoupon],
                }));
            }
        } catch (error) {
            console.error('Error adding coupon:', error);
        }
    };

    const deleteBucketItem = async (id: string) => {
        const originalList = state.bucketList;
        setState((prev) => ({
            ...prev,
            bucketList: prev.bucketList.filter((item) => item.id !== id),
        }));

        try {
            await deleteBucketItemInDb(id);
        } catch (error) {
            console.error('Error deleting bucket item:', error);
            setState(prev => ({ ...prev, bucketList: originalList }));
        }
    };

    const deleteCoupon = async (id: string) => {
        const originalList = state.coupons;
        setState((prev) => ({
            ...prev,
            coupons: prev.coupons.filter((coupon) => coupon.id !== id),
        }));

        try {
            await deleteCouponInDb(id);
        } catch (error) {
            console.error('Error deleting coupon:', error);
            setState(prev => ({ ...prev, coupons: originalList }));
        }
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
                deleteBucketItem,
                deleteCoupon,
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
