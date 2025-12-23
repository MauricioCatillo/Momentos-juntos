import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clapperboard, ShoppingBag, Mountain, Pizza, Sparkles, Plus, CheckCircle2, Trash2, Circle, X, Loader2, Ticket } from 'lucide-react';
import { getBucketList, addBucketItem, toggleBucketItem, deleteBucketItem, getCoupons, addCoupon, redeemCoupon, deleteCoupon } from '../supabaseClient';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// Categories Configuration
const CATEGORIES = [
    { id: 'Viajes', label: 'Viajes', icon: Plane, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { id: 'Películas', label: 'Películas', icon: Clapperboard, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' },
    { id: 'Compras', label: 'Compras', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300' },
    { id: 'Aventura', label: 'Aventura', icon: Mountain, color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300' },
    { id: 'Comida', label: 'Comida', icon: Pizza, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' },
    { id: 'Otro', label: 'Otro', icon: Sparkles, color: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' },
] as const;

interface WishItem {
    id: string;
    text: string;
    description?: string;
    category?: string;
    completed: boolean;
    created_at: string;
}

interface Coupon {
    id: string;
    title: string;
    redeemed: boolean;
    created_at: string;
}

export const BucketList: React.FC = () => {
    // Main tab state
    const [activeTab, setActiveTab] = useState<'wishes' | 'coupons'>('wishes');

    // Wishes state
    const [wishes, setWishes] = useState<WishItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [isAdding, setIsAdding] = useState(false);

    // Coupons state
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [couponsLoading, setCouponsLoading] = useState(true);
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [newCouponTitle, setNewCouponTitle] = useState('');

    // Form State
    const [newWish, setNewWish] = useState({ text: '', category: 'Viajes', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadWishes();
        loadCoupons();
    }, []);

    const loadWishes = async () => {
        try {
            const data = await getBucketList();
            setWishes(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar la lista de deseos');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCoupons = async () => {
        try {
            const data = await getCoupons();
            setCoupons(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar los cupones');
        } finally {
            setCouponsLoading(false);
        }
    };

    const handleAddWish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWish.text.trim()) return;

        setIsSubmitting(true);
        try {
            const added = await addBucketItem(newWish.text, newWish.category, newWish.description);
            setWishes([added, ...wishes]);
            setNewWish({ text: '', category: 'Viajes', description: '' });
            setIsAdding(false);
            toast.success('¡Deseo agregado! ✨');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo guardar el deseo');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setWishes(wishes.map(w => w.id === id ? { ...w, completed: !currentStatus } : w));

        try {
            await toggleBucketItem(id, !currentStatus);
            if (!currentStatus) {
                toast.success('¡Deseo cumplido! 🎉');
            }
        } catch (error) {
            console.error(error);
            // Revert on error
            setWishes(wishes.map(w => w.id === id ? { ...w, completed: currentStatus } : w));
            toast.error('Error al actualizar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este deseo?')) return;

        try {
            await deleteBucketItem(id);
            setWishes(wishes.filter(w => w.id !== id));
            toast.success('Deseo eliminado');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar');
        }
    };

    // Coupon handlers
    const handleAddCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCouponTitle.trim()) return;

        setIsSubmitting(true);
        try {
            const added = await addCoupon(newCouponTitle);
            setCoupons([added, ...coupons]);
            setNewCouponTitle('');
            setIsAddingCoupon(false);
            toast.success('¡Cupón creado! 🎟️');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo crear el cupón');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRedeemCoupon = async (id: string) => {
        setCoupons(coupons.map(c => c.id === id ? { ...c, redeemed: true } : c));
        try {
            await redeemCoupon(id);
            toast.success('¡Cupón canjeado! 🎉');
        } catch (error) {
            console.error(error);
            setCoupons(coupons.map(c => c.id === id ? { ...c, redeemed: false } : c));
            toast.error('Error al canjear');
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
        try {
            await deleteCoupon(id);
            setCoupons(coupons.filter(c => c.id !== id));
            toast.success('Cupón eliminado');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar');
        }
    };

    const filteredWishes = selectedCategory === 'Todos'
        ? wishes
        : wishes.filter(w => (w.category || 'Otro') === selectedCategory);

    const activeWishes = filteredWishes.filter(w => !w.completed);
    const completedWishes = filteredWishes.filter(w => w.completed);
    const activeCoupons = coupons.filter(c => !c.redeemed);
    const redeemedCoupons = coupons.filter(c => c.redeemed);

    return (
        <div className="p-6 pb-24 min-h-screen">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                        {activeTab === 'wishes' ? 'Lista de Deseos ✨' : 'Cuponera 🎟️'}
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                        {activeTab === 'wishes' ? 'Nuestros sueños por cumplir' : 'Cupones especiales para canjear'}
                    </p>
                </div>
                <button
                    onClick={() => activeTab === 'wishes' ? setIsAdding(true) : setIsAddingCoupon(true)}
                    className={cn(
                        "w-10 h-10 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform",
                        activeTab === 'wishes' ? 'bg-indigo-600' : 'bg-rose-500'
                    )}
                >
                    <Plus size={24} />
                </button>
            </header>

            {/* Main Tabs */}
            <div className="flex p-1 bg-stone-200/50 dark:bg-stone-800/50 rounded-xl mb-4">
                <button
                    onClick={() => setActiveTab('wishes')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                        activeTab === 'wishes'
                            ? "bg-white dark:bg-stone-700 shadow-sm text-stone-800 dark:text-stone-100"
                            : "text-stone-500 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    )}
                >
                    <Sparkles size={16} />
                    Deseos
                </button>
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                        activeTab === 'coupons'
                            ? "bg-white dark:bg-stone-700 shadow-sm text-stone-800 dark:text-stone-100"
                            : "text-stone-500 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    )}
                >
                    <Ticket size={16} />
                    Cupones
                </button>
            </div>

            {/* Wishes Tab Content */}
            {activeTab === 'wishes' && (
                <>
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-6 px-6">
                        <button
                            onClick={() => setSelectedCategory('Todos')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'Todos'
                                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 shadow-sm'
                                }`}
                        >
                            Todos
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${selectedCategory === cat.id
                                    ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-md'
                                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 shadow-sm'
                                    }`}
                            >
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Active Wishes */}
                            <AnimatePresence mode='popLayout'>
                                {activeWishes.map((wish) => {
                                    const CategoryIcon = CATEGORIES.find(c => c.id === wish.category)?.icon || Sparkles;
                                    return (
                                        <motion.div
                                            key={wish.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="glass-card p-4 rounded-2xl flex items-start gap-4 group"
                                        >
                                            <button
                                                onClick={() => handleToggle(wish.id, wish.completed)}
                                                className="mt-1 text-stone-300 hover:text-indigo-500 transition-colors"
                                            >
                                                <Circle size={24} />
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg leading-tight mb-1">
                                                        {wish.text}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleDelete(wish.id)}
                                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                {wish.description && (
                                                    <p className="text-stone-600 dark:text-stone-400 text-sm mb-2">
                                                        {wish.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${CATEGORIES.find(c => c.id === wish.category)?.color || 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                                                        }`}>
                                                        <CategoryIcon size={10} />
                                                        {(wish.category || 'Otro').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Completed Section */}
                            {completedWishes.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 pl-2">Cumplidos ({completedWishes.length})</h3>
                                    <div className="space-y-3 opacity-60">
                                        {completedWishes.map((wish) => (
                                            <div key={wish.id} className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggle(wish.id, wish.completed)}
                                                    className="text-green-500"
                                                >
                                                    <CheckCircle2 size={24} />
                                                </button>
                                                <span className="line-through text-stone-500 dark:text-stone-400 flex-1">{wish.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {wishes.length === 0 && (
                                <div className="text-center py-12 px-6">
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                        <Sparkles size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-stone-700 dark:text-stone-200 mb-2">Lista vacía</h3>
                                    <p className="text-stone-500 dark:text-stone-400 text-sm">
                                        ¿Qué sueño quieres cumplir con amor?<br />¡Agrega el primero!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Coupons Tab Content */}
            {activeTab === 'coupons' && (
                <>
                    {couponsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-rose-500" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Active Coupons */}
                            <AnimatePresence mode='popLayout'>
                                {activeCoupons.map((coupon) => (
                                    <motion.div
                                        key={coupon.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative p-6 rounded-2xl border-2 border-dashed glass-card border-rose-300 dark:border-rose-500/50 hover:shadow-md overflow-hidden group"
                                    >
                                        {/* Ticket cutouts */}
                                        <div className="absolute top-1/2 -left-3 w-6 h-6 bg-stone-50 dark:bg-stone-900 rounded-full" />
                                        <div className="absolute top-1/2 -right-3 w-6 h-6 bg-stone-50 dark:bg-stone-900 rounded-full" />

                                        <button
                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                            className="absolute top-2 right-2 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-500">
                                                <Ticket size={24} />
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full uppercase">
                                                Disponible
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 break-words">{coupon.title}</h3>

                                        <button
                                            onClick={() => handleRedeemCoupon(coupon.id)}
                                            className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-all"
                                        >
                                            Canjear Cupón
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Redeemed Section */}
                            {redeemedCoupons.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 pl-2">Canjeados ({redeemedCoupons.length})</h3>
                                    <div className="space-y-3 opacity-60">
                                        {redeemedCoupons.map((coupon) => (
                                            <div key={coupon.id} className="bg-stone-100 dark:bg-stone-800/50 p-4 rounded-xl flex items-center gap-3 border-2 border-dashed border-stone-300 dark:border-stone-700">
                                                <div className="p-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-stone-400">
                                                    <Ticket size={20} />
                                                </div>
                                                <span className="line-through text-stone-500 dark:text-stone-400 flex-1">{coupon.title}</span>
                                                <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-500 text-xs font-bold rounded-full">USADO</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {coupons.length === 0 && (
                                <div className="text-center py-12 px-6">
                                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
                                        <Ticket size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-stone-700 dark:text-stone-200 mb-2">Sin cupones</h3>
                                    <p className="text-stone-500 dark:text-stone-400 text-sm">
                                        ¡Crea cupones especiales para tu amor!<br />Ej: "Vale por un abrazo"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Add Modal */}
            <AnimatePresence>
                {isAdding && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 py-12 px-4 flex items-end sm:items-center justify-center"
                            onClick={() => setIsAdding(false)}
                        >
                            <motion.div
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold dark:text-stone-100">Nuevo Deseo ✨</h2>
                                    <button onClick={() => setIsAdding(false)} className="p-2 bg-stone-100 dark:bg-stone-700 rounded-full">
                                        <X size={20} className="dark:text-stone-300" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddWish} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">¿Qué quieres hacer?</label>
                                        <input
                                            autoFocus
                                            value={newWish.text}
                                            onChange={e => setNewWish({ ...newWish, text: e.target.value })}
                                            placeholder="Ej. Viajar a París..."
                                            className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-indigo-200 dark:text-stone-100"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Categoría</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setNewWish({ ...newWish, category: cat.id })}
                                                    className={`p-2 rounded-xl text-xs font-medium border-2 transition-all flex flex-col items-center gap-1 ${newWish.category === cat.id
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                        : 'border-transparent bg-stone-50 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                                                        }`}
                                                >
                                                    <cat.icon size={16} />
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Detalles (Opcional)</label>
                                        <textarea
                                            value={newWish.description}
                                            onChange={e => setNewWish({ ...newWish, description: e.target.value })}
                                            placeholder="Más información..."
                                            className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-indigo-200 h-20 resize-none dark:text-stone-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newWish.text || isSubmitting}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                                    >
                                        {isSubmitting ? 'Guardando...' : 'Agregar a la Lista'}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Coupon Modal */}
            <AnimatePresence>
                {isAddingCoupon && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 py-12 px-4 flex items-end sm:items-center justify-center"
                            onClick={() => setIsAddingCoupon(false)}
                        >
                            <motion.div
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold dark:text-stone-100">Nuevo Cupón 🎟️</h2>
                                    <button onClick={() => setIsAddingCoupon(false)} className="p-2 bg-stone-100 dark:bg-stone-700 rounded-full">
                                        <X size={20} className="dark:text-stone-300" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddCoupon} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">¿Qué vale este cupón?</label>
                                        <input
                                            autoFocus
                                            value={newCouponTitle}
                                            onChange={e => setNewCouponTitle(e.target.value)}
                                            placeholder="Ej. Vale por un abrazo..."
                                            className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-rose-200 dark:text-stone-100"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newCouponTitle.trim() || isSubmitting}
                                        className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                                    >
                                        {isSubmitting ? 'Creando...' : 'Crear Cupón'}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
