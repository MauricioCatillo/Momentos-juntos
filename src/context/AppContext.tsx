import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
    addBucketItem as addBucketItemToDb,
    addCoupon as addCouponToDb,
    addMilestone as addMilestoneToDb,
    deleteBucketItem as deleteBucketItemInDb,
    deleteCoupon as deleteCouponInDb,
    getBucketList,
    getCoupons,
    getMilestones,
    redeemCoupon as redeemCouponInDb,
    signInWithEmail,
    signOut,
    signUpWithEmail,
    supabase,
    toggleBucketItem as toggleBucketItemInDb,
} from '../supabaseClient';
import { isPreviewModeEnabled } from '../lib/previewMode';
import { PREVIEW_BUCKET_ITEMS, PREVIEW_COUPONS, PREVIEW_MILESTONES, PREVIEW_MOODS } from '../lib/previewData';

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
    toggleTheme: () => void;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    addMilestone: (milestone: Milestone) => void;
    addMood: (mood: string, note?: string) => Promise<void>;
    toggleBucketItem: (id: string) => void;
    addBucketItem: (text: string) => void;
    redeemCoupon: (id: string) => void;
    addCoupon: (title: string) => void;
    deleteBucketItem: (id: string) => void;
    deleteCoupon: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PREVIEW_USER = {
    id: 'preview-user',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'preview@mi-prometida.local',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
} as User;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const previewMode = isPreviewModeEnabled();
    const [state, setState] = useState<AppState>({
        user: null,
        session: null,
        loading: true,
        anniversaryDate: '2023-01-01',
        milestones: [],
        moods: [],
        bucketList: [],
        coupons: [],
    });

    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        if (previewMode) {
            setState((prev) => ({ ...prev, session: null, user: PREVIEW_USER, loading: false }));
            return;
        }

        void supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setState((prev) => ({ ...prev, session, user: session?.user ?? null, loading: false }));
            })
            .catch((error) => {
                console.error('Error restoring session:', error);
                setState((prev) => ({ ...prev, loading: false }));
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState((prev) => {
                if (prev.session?.access_token === session?.access_token && prev.user?.id === session?.user?.id && !prev.loading) {
                    return prev;
                }

                return { ...prev, session, user: session?.user ?? null, loading: false };
            });
        });

        return () => subscription.unsubscribe();
    }, [previewMode]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!state.user) return;

            if (previewMode) {
                setState((prev) => ({
                    ...prev,
                    moods: PREVIEW_MOODS,
                    bucketList: PREVIEW_BUCKET_ITEMS,
                    coupons: PREVIEW_COUPONS,
                    milestones: PREVIEW_MILESTONES,
                }));
                return;
            }

            try {
                const [moodsData, bucketData, couponsData, milestonesData] = await Promise.all([
                    supabase.from('moods').select('*').order('created_at', { ascending: false }).limit(7),
                    getBucketList(),
                    getCoupons(),
                    getMilestones(),
                ]);

                setState((prev) => ({
                    ...prev,
                    moods: moodsData.data
                        ? moodsData.data.map((mood) => ({
                            id: mood.id,
                            date: mood.created_at,
                            mood: mood.mood,
                            note: mood.note,
                        }))
                        : [],
                    bucketList: bucketData || [],
                    coupons: couponsData || [],
                    milestones: milestonesData || [],
                }));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        void fetchData();
    }, [previewMode, state.user]);

    const login = async (email: string, password: string) => {
        const { session, user } = await signInWithEmail(email, password);

        setState((prev) => ({
            ...prev,
            session: session ?? prev.session,
            user: user ?? session?.user ?? prev.user,
            loading: false,
        }));
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
                user_id: state.user?.id,
            });

            if (newMilestone) {
                setState((prev) => ({ ...prev, milestones: [...prev.milestones, newMilestone] }));
            }
        } catch (error) {
            console.error('Error adding milestone:', error);
        }
    };

    const addMood = async (mood: string, note: string = '') => {
        if (!state.user) return;

        const todayKey = new Date().toDateString();
        const existingTodayMood = state.moods.find((item) => new Date(item.date).toDateString() === todayKey);
        const normalizedNote = note.trim();

        if (previewMode) {
            if (existingTodayMood) {
                setState((prev) => ({
                    ...prev,
                    moods: prev.moods.map((entry) =>
                        entry.id === existingTodayMood.id
                            ? { ...entry, mood, note: normalizedNote, date: new Date().toISOString() }
                            : entry
                    ),
                }));
                return;
            }

            setState((prev) => ({
                ...prev,
                moods: [
                    {
                        id: `preview-mood-${Date.now()}`,
                        date: new Date().toISOString(),
                        mood,
                        note: normalizedNote,
                    },
                    ...prev.moods,
                ],
            }));
            return;
        }

        if (existingTodayMood) {
            const previousMood = existingTodayMood;

            setState((prev) => ({
                ...prev,
                moods: prev.moods.map((entry) =>
                    entry.id === existingTodayMood.id
                        ? { ...entry, mood, note: normalizedNote, date: new Date().toISOString() }
                        : entry
                ),
            }));

            try {
                const { data, error } = await supabase
                    .from('moods')
                    .update({
                        mood,
                        note: normalizedNote || null,
                    })
                    .eq('id', existingTodayMood.id)
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    setState((prev) => ({
                        ...prev,
                        moods: prev.moods.map((entry) =>
                            entry.id === existingTodayMood.id
                                ? {
                                    id: data.id,
                                    date: data.created_at,
                                    mood: data.mood,
                                    note: data.note,
                                }
                                : entry
                        ),
                    }));
                }
            } catch (error) {
                console.error('Error updating today mood:', error);
                setState((prev) => ({
                    ...prev,
                    moods: prev.moods.map((entry) =>
                        entry.id === previousMood.id ? previousMood : entry
                    ),
                }));
            }

            return;
        }

        const tempId = `temp-${Date.now()}`;
        const tempMood = {
            id: tempId,
            date: new Date().toISOString(),
            mood,
            note: normalizedNote,
        };

        setState((prev) => ({
            ...prev,
            moods: [tempMood, ...prev.moods],
        }));

        try {
            const { data, error } = await supabase
                .from('moods')
                .insert([
                    {
                        mood,
                        note: normalizedNote || null,
                        user_id: state.user.id,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setState((prev) => ({
                    ...prev,
                    moods: prev.moods.map((entry) =>
                        entry.id === tempId
                            ? {
                                id: data.id,
                                date: data.created_at,
                                mood: data.mood,
                                note: data.note,
                            }
                            : entry
                    ),
                }));
            }
        } catch (error) {
            console.error('Error adding mood:', error);
            setState((prev) => ({
                ...prev,
                moods: prev.moods.filter((entry) => entry.id !== tempId),
            }));
        }
    };

    const toggleBucketItem = async (id: string) => {
        const item = state.bucketList.find((entry) => entry.id === id);
        if (!item) return;

        setState((prev) => ({
            ...prev,
            bucketList: prev.bucketList.map((entry) =>
                entry.id === id ? { ...entry, completed: !entry.completed } : entry
            ),
        }));

        try {
            await toggleBucketItemInDb(id, !item.completed);
        } catch (error) {
            console.error('Error toggling bucket item:', error);
            setState((prev) => ({
                ...prev,
                bucketList: prev.bucketList.map((entry) =>
                    entry.id === id ? { ...entry, completed: !entry.completed } : entry
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
            bucketList: prev.bucketList.filter((entry) => entry.id !== id),
        }));

        try {
            await deleteBucketItemInDb(id);
        } catch (error) {
            console.error('Error deleting bucket item:', error);
            setState((prev) => ({ ...prev, bucketList: originalList }));
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
            setState((prev) => ({ ...prev, coupons: originalList }));
        }
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
                addCoupon,
                deleteBucketItem,
                deleteCoupon,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
