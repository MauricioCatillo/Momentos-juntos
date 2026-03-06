import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plane,
    Clapperboard,
    ShoppingBag,
    Mountain,
    Pizza,
    Sparkles,
    Plus,
    CheckCircle2,
    Trash2,
    Circle,
    X,
    Loader2,
    Ticket,
} from 'lucide-react';
import {
    getBucketList,
    addBucketItem,
    toggleBucketItem,
    deleteBucketItem,
    getCoupons,
    addCoupon,
    redeemCoupon,
    deleteCoupon,
} from '../supabaseClient';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';

const CATEGORIES = [
    { id: 'Viajes', label: 'Viajes', icon: Plane, color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-200' },
    { id: 'Peliculas', label: 'Peliculas', icon: Clapperboard, color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200' },
    { id: 'Compras', label: 'Compras', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-200' },
    { id: 'Aventura', label: 'Aventura', icon: Mountain, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200' },
    { id: 'Comida', label: 'Comida', icon: Pizza, color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-200' },
    { id: 'Otro', label: 'Otro', icon: Sparkles, color: 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-200' },
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
    const [activeTab, setActiveTab] = useState<'wishes' | 'coupons'>('wishes');
    const [wishes, setWishes] = useState<WishItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [isAdding, setIsAdding] = useState(false);

    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [couponsLoading, setCouponsLoading] = useState(true);
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [newCouponTitle, setNewCouponTitle] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'wish' | 'coupon'; id: string } | null>(null);

    const [newWish, setNewWish] = useState({ text: '', category: 'Viajes', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        void loadWishes();
        void loadCoupons();
    }, []);

    const loadWishes = async () => {
        try {
            const data = await getBucketList();
            setWishes(data || []);
        } catch (error) {
            console.error(error);
            toast.error('No se pudo cargar la lista.');
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
            toast.error('No se pudieron cargar los cupones.');
        } finally {
            setCouponsLoading(false);
        }
    };

    const handleAddWish = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newWish.text.trim()) return;

        setIsSubmitting(true);
        try {
            const added = await addBucketItem(newWish.text, newWish.category, newWish.description);
            setWishes((prev) => [added, ...prev]);
            setNewWish({ text: '', category: 'Viajes', description: '' });
            setIsAdding(false);
            toast.success('Deseo agregado.');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo guardar el deseo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, completed: !currentStatus } : wish)));

        try {
            await toggleBucketItem(id, !currentStatus);
            if (!currentStatus) toast.success('Deseo marcado como cumplido.');
        } catch (error) {
            console.error(error);
            setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, completed: currentStatus } : wish)));
            toast.error('No se pudo actualizar.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteBucketItem(id);
            setWishes((prev) => prev.filter((wish) => wish.id !== id));
            toast.success('Deseo eliminado.');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar.');
        }
    };

    const handleAddCoupon = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newCouponTitle.trim()) return;

        setIsSubmitting(true);
        try {
            const added = await addCoupon(newCouponTitle);
            setCoupons((prev) => [added, ...prev]);
            setNewCouponTitle('');
            setIsAddingCoupon(false);
            toast.success('Cupon creado.');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo crear el cupon.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRedeemCoupon = async (id: string) => {
        setCoupons(coupons.map((coupon) => (coupon.id === id ? { ...coupon, redeemed: true } : coupon)));
        try {
            await redeemCoupon(id);
            toast.success('Cupon canjeado.');
        } catch (error) {
            console.error(error);
            setCoupons(coupons.map((coupon) => (coupon.id === id ? { ...coupon, redeemed: false } : coupon)));
            toast.error('No se pudo canjear.');
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        try {
            await deleteCoupon(id);
            setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
            toast.success('Cupon eliminado.');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar.');
        }
    };

    const filteredWishes = selectedCategory === 'Todos'
        ? wishes
        : wishes.filter((wish) => (wish.category || 'Otro') === selectedCategory);

    const activeWishes = filteredWishes.filter((wish) => !wish.completed);
    const completedWishes = filteredWishes.filter((wish) => wish.completed);
    const activeCoupons = coupons.filter((coupon) => !coupon.redeemed);
    const redeemedCoupons = coupons.filter((coupon) => coupon.redeemed);

    return (
        <div className="page-shell">
            <PageHeader
                kicker={activeTab === 'wishes' ? 'Planes' : 'Cupones'}
                title={activeTab === 'wishes' ? 'Lista de deseos' : 'Cuponera'}
                action={(
                    <button
                        onClick={() => (activeTab === 'wishes' ? setIsAdding(true) : setIsAddingCoupon(true))}
                        className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg',
                            activeTab === 'wishes' ? 'bg-gradient-to-br from-violet-500 to-indigo-500' : 'bg-gradient-to-br from-rose-500 to-pink-500'
                        )}
                    >
                        <Plus size={20} />
                    </button>
                )}
            />

            <section className="section-card rounded-[1.9rem] p-3">
                <div className="pill-toggle grid w-full grid-cols-2">
                    <button onClick={() => setActiveTab('wishes')} className={activeTab === 'wishes' ? 'is-active' : ''}>
                        Deseos
                    </button>
                    <button onClick={() => setActiveTab('coupons')} className={activeTab === 'coupons' ? 'is-active' : ''}>
                        Cupones
                    </button>
                </div>
            </section>

            {activeTab === 'wishes' && (
                <>
                    <section className="chip-scroll scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setSelectedCategory('Todos')}
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap',
                                selectedCategory === 'Todos'
                                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                    : 'section-card'
                            )}
                        >
                            Todos
                        </button>

                        {CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap',
                                    selectedCategory === category.id
                                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                        : 'section-card'
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </section>

                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="animate-spin text-violet-500" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {activeWishes.map((wish) => {
                                        const category = CATEGORIES.find((item) => item.id === wish.category) || CATEGORIES[CATEGORIES.length - 1];
                                        const CategoryIcon = category.icon;

                                        return (
                                            <motion.article
                                                key={wish.id}
                                                layout
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="section-card rounded-[1.7rem] p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => handleToggle(wish.id, wish.completed)}
                                                        className="mt-1 shrink-0 text-stone-300 transition-colors hover:text-violet-500"
                                                    >
                                                        <Circle size={22} />
                                                    </button>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                                                                    {wish.text}
                                                                </h2>
                                                                {wish.description && (
                                                                    <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
                                                                        {wish.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => setDeleteTarget({ type: 'wish', id: wish.id })}
                                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        <div className={cn('mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]', category.color)}>
                                                            <CategoryIcon size={12} />
                                                            {wish.category || 'Otro'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.article>
                                        );
                                    })}
                                </AnimatePresence>

                                {activeWishes.length === 0 && wishes.length > 0 && (
                                    <EmptyState title="Nada por aqui" description="Cambia la categoria." />
                                )}

                                {wishes.length === 0 && (
                                    <EmptyState
                                        title="Sin deseos"
                                        description="Agrega el primero."
                                        icon={<Sparkles size={28} className="text-violet-500 dark:text-violet-200" />}
                                    />
                                )}
                            </div>

                            {completedWishes.length > 0 && (
                                <section>
                                    <p className="section-label mb-3">Cumplidos</p>
                                    <div className="space-y-3">
                                        {completedWishes.map((wish) => (
                                            <div
                                                key={wish.id}
                                                className="rounded-[1.5rem] border border-white/60 bg-white/45 px-4 py-3 text-stone-500 shadow-sm dark:border-white/8 dark:bg-white/5 dark:text-stone-400"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleToggle(wish.id, wish.completed)} className="text-emerald-500">
                                                        <CheckCircle2 size={22} />
                                                    </button>
                                                    <span className="line-through">{wish.text}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'coupons' && (
                <div className="space-y-4">
                    {couponsLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="animate-spin text-rose-500" size={32} />
                        </div>
                    ) : (
                        <>
                            <AnimatePresence mode="popLayout">
                                {activeCoupons.map((coupon) => (
                                    <motion.article
                                        key={coupon.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="section-card relative overflow-hidden rounded-[1.8rem] border-2 border-dashed border-rose-300 p-5 dark:border-rose-400/30"
                                    >
                                        <div className="absolute left-[-0.7rem] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg-via)]" />
                                        <div className="absolute right-[-0.7rem] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg-via)]" />

                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                                                    <Ticket size={22} />
                                                </div>
                                                <h2 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                                    {coupon.title}
                                                </h2>
                                            </div>

                                            <button
                                                onClick={() => setDeleteTarget({ type: 'coupon', id: coupon.id })}
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <button onClick={() => handleRedeemCoupon(coupon.id)} className="primary-button mt-5 w-full">
                                            Canjear cupon
                                        </button>
                                    </motion.article>
                                ))}
                            </AnimatePresence>

                            {coupons.length === 0 && (
                                <EmptyState
                                    title="Sin cupones"
                                    description="Crea uno nuevo."
                                    icon={<Ticket size={28} className="text-rose-500 dark:text-rose-200" />}
                                />
                            )}

                            {redeemedCoupons.length > 0 && (
                                <section>
                                    <p className="section-label mb-3">Canjeados</p>
                                    <div className="space-y-3">
                                        {redeemedCoupons.map((coupon) => (
                                            <div
                                                key={coupon.id}
                                                className="rounded-[1.5rem] border border-dashed border-white/60 bg-white/45 px-4 py-3 text-stone-500 shadow-sm dark:border-white/8 dark:bg-white/5 dark:text-stone-400"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-white/8 dark:text-stone-300">
                                                        <Ticket size={16} />
                                                    </div>
                                                    <span className="flex-1 line-through">{coupon.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={() => setIsAdding(false)}
                    >
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            onClick={(event) => event.stopPropagation()}
                            className="modal-card"
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="section-label">Nuevo deseo</p>
                                    <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                        Nuevo deseo
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddWish} className="space-y-4">
                                <label className="block">
                                    <span className="section-label mb-2 block">Que quieren hacer</span>
                                    <input
                                        autoFocus
                                        value={newWish.text}
                                        onChange={(event) => setNewWish({ ...newWish, text: event.target.value })}
                                        placeholder="Ej. Escapada de fin de semana"
                                        className="input-shell"
                                        required
                                    />
                                </label>

                                <div>
                                    <span className="section-label mb-2 block">Categoria</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map((category) => {
                                            const Icon = category.icon;

                                            return (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => setNewWish({ ...newWish, category: category.id })}
                                                    className={cn(
                                                        'rounded-[1.2rem] border px-3 py-3 text-sm font-medium transition-all',
                                                        newWish.category === category.id
                                                            ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-300/40 dark:bg-violet-500/10 dark:text-violet-200'
                                                            : 'border-white/70 bg-white/60 text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-300'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Icon size={16} />
                                                        {category.label}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <label className="block">
                                    <span className="section-label mb-2 block">Detalles</span>
                                    <textarea
                                        value={newWish.description}
                                        onChange={(event) => setNewWish({ ...newWish, description: event.target.value })}
                                        placeholder="Algo breve para recordar la idea"
                                        className="textarea-shell min-h-[7rem]"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={!newWish.text || isSubmitting}
                                    className="primary-button w-full disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar deseo'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAddingCoupon && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={() => setIsAddingCoupon(false)}
                    >
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            onClick={(event) => event.stopPropagation()}
                            className="modal-card"
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="section-label">Nuevo cupon</p>
                                    <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                        Nuevo cupon
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsAddingCoupon(false)}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddCoupon} className="space-y-4">
                                <label className="block">
                                    <span className="section-label mb-2 block">Que vale este cupon</span>
                                    <input
                                        autoFocus
                                        value={newCouponTitle}
                                        onChange={(event) => setNewCouponTitle(event.target.value)}
                                        placeholder="Ej. Vale por elegir la cita"
                                        className="input-shell"
                                        required
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={!newCouponTitle.trim() || isSubmitting}
                                    className="primary-button w-full disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Creando...' : 'Guardar cupon'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget?.type === 'wish') {
                        handleDelete(deleteTarget.id);
                    } else if (deleteTarget?.type === 'coupon') {
                        handleDeleteCoupon(deleteTarget.id);
                    }
                }}
                title={deleteTarget?.type === 'wish' ? 'Borrar deseo?' : 'Borrar cupon?'}
                message={deleteTarget?.type === 'wish'
                    ? 'Este deseo se eliminara de la lista.'
                    : 'Este cupon se eliminara permanentemente.'
                }
                confirmText="Si, borrar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};
