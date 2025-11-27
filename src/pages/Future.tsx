import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Ticket, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export const Future: React.FC = () => {
    const { bucketList, coupons, toggleBucketItem, addBucketItem, redeemCoupon, addCoupon, deleteBucketItem, deleteCoupon } = useApp();
    const [newItem, setNewItem] = useState('');
    const [newCoupon, setNewCoupon] = useState('');
    const [activeTab, setActiveTab] = useState<'bucket' | 'coupons'>('bucket');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        addBucketItem(newItem);
        setNewItem('');
    };

    const handleAddCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoupon.trim()) return;
        addCoupon(newCoupon);
        setNewCoupon('');
    };

    return (
        <div className="p-6 pb-24 min-h-screen">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Futuro & Juegos 🚀</h1>

                <div className="flex p-1 bg-stone-200/50 dark:bg-stone-800/50 rounded-xl mt-4">
                    <button
                        onClick={() => setActiveTab('bucket')}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'bucket' ? "bg-white dark:bg-stone-700 shadow-sm text-stone-800 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                        )}
                    >
                        Lista de Deseos
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'coupons' ? "bg-white dark:bg-stone-700 shadow-sm text-stone-800 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                        )}
                    >
                        Cuponera
                    </button>
                </div>
            </header>

            {activeTab === 'bucket' ? (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                >
                    <form onSubmit={handleAddItem} className="relative">
                        <input
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Agregar nuevo sueño..."
                            className="w-full px-4 py-3 pr-12 rounded-xl glass-input shadow-sm focus:ring-2 focus:ring-soft-blush/20 transition-all dark:text-stone-100 dark:placeholder:text-stone-400"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg active:scale-95 transition-transform"
                        >
                            <Plus size={16} />
                        </button>
                    </form>

                    <div className="space-y-3">
                        {bucketList.map((item: { id: string; completed: boolean; text: string }) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl transition-all group relative",
                                    item.completed ? "bg-sage-green/20 dark:bg-sage-green/10" : "glass-card"
                                )}
                            >
                                <button
                                    onClick={() => toggleBucketItem(item.id)}
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        item.completed ? "bg-sage-green border-sage-green text-white" : "border-stone-300 dark:border-stone-600 text-transparent hover:border-sage-green"
                                    )}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </button>
                                <span className={cn("flex-1 break-words pr-8", item.completed ? "text-stone-400 dark:text-stone-500 line-through" : "text-stone-800 dark:text-stone-100")}>
                                    {item.text}
                                </span>
                                <button
                                    onClick={() => deleteBucketItem(item.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <form onSubmit={handleAddCoupon} className="relative">
                        <input
                            value={newCoupon}
                            onChange={(e) => setNewCoupon(e.target.value)}
                            placeholder="Nuevo cupón (ej: Vale por un abrazo)..."
                            className="w-full px-4 py-3 pr-12 rounded-xl glass-input shadow-sm focus:ring-2 focus:ring-soft-blush/20 transition-all dark:text-stone-100 dark:placeholder:text-stone-400"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg active:scale-95 transition-transform"
                        >
                            <Plus size={16} />
                        </button>
                    </form>

                    <div className="grid grid-cols-1 gap-4">
                        {coupons.map((coupon: { id: string; redeemed: boolean; title: string }) => (
                            <motion.div
                                key={coupon.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "relative p-6 rounded-2xl border-2 border-dashed transition-all overflow-hidden group",
                                    coupon.redeemed
                                        ? "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 opacity-70"
                                        : "glass-card border-soft-blush hover:border-soft-blush/70 hover:shadow-md"
                                )}
                            >
                                {/* Ticket cutouts */}
                                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-stone-50 dark:bg-stone-900 rounded-full" />
                                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-stone-50 dark:bg-stone-900 rounded-full" />

                                <button
                                    onClick={() => deleteCoupon(coupon.id)}
                                    className="absolute top-2 right-2 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-soft-blush/10 rounded-lg text-soft-blush">
                                        <Ticket size={24} />
                                    </div>
                                    {coupon.redeemed ? (
                                        <span className="px-3 py-1 bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 text-xs font-bold rounded-full uppercase">
                                            Usado
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-sage-green/10 text-sage-green text-xs font-bold rounded-full uppercase">
                                            Disponible
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 break-words">{coupon.title}</h3>

                                {!coupon.redeemed && (
                                    <button
                                        onClick={() => redeemCoupon(coupon.id)}
                                        className="w-full py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg text-sm font-medium hover:bg-stone-900 dark:hover:bg-stone-600 active:scale-95 transition-all"
                                    >
                                        Canjear Cupón
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
