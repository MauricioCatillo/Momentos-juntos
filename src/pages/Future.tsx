import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export const Future: React.FC = () => {
    const { bucketList, coupons, toggleBucketItem, addBucketItem, redeemCoupon } = useApp();
    const [newItem, setNewItem] = useState('');
    const [activeTab, setActiveTab] = useState<'bucket' | 'coupons'>('bucket');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        addBucketItem(newItem);
        setNewItem('');
    };

    return (
        <div className="p-6 pb-24 min-h-screen">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 mb-2">Futuro & Juegos 🚀</h1>

                <div className="flex p-1 bg-stone-200/50 rounded-xl mt-4">
                    <button
                        onClick={() => setActiveTab('bucket')}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'bucket' ? "bg-white shadow-sm text-stone-800" : "text-stone-500 hover:text-stone-600"
                        )}
                    >
                        Lista de Deseos
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'coupons' ? "bg-white shadow-sm text-stone-800" : "text-stone-500 hover:text-stone-600"
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
                            className="w-full px-4 py-3 pr-12 rounded-xl glass-input shadow-sm focus:ring-2 focus:ring-soft-blush/20 transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-stone-800 text-white rounded-lg active:scale-95 transition-transform"
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
                                    "flex items-center gap-3 p-4 rounded-xl transition-all",
                                    item.completed ? "bg-sage-green/20" : "glass-card"
                                )}
                            >
                                <button
                                    onClick={() => toggleBucketItem(item.id)}
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        item.completed ? "bg-sage-green border-sage-green text-white" : "border-stone-300 text-transparent hover:border-sage-green"
                                    )}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </button>
                                <span className={cn("flex-1", item.completed ? "text-stone-400 line-through" : "text-stone-800")}>
                                    {item.text}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 gap-4"
                >
                    {coupons.map((coupon: { id: string; redeemed: boolean; title: string }) => (
                        <motion.div
                            key={coupon.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "relative p-6 rounded-2xl border-2 border-dashed transition-all overflow-hidden group",
                                coupon.redeemed
                                    ? "bg-stone-100 border-stone-300 opacity-70"
                                    : "glass-card border-soft-blush hover:border-soft-blush/70 hover:shadow-md"
                            )}
                        >
                            {/* Ticket cutouts */}
                            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-stone-50 rounded-full" />
                            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-stone-50 rounded-full" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-soft-blush/10 rounded-lg text-soft-blush">
                                    <Ticket size={24} />
                                </div>
                                {coupon.redeemed ? (
                                    <span className="px-3 py-1 bg-stone-200 text-stone-500 text-xs font-bold rounded-full uppercase">
                                        Usado
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-sage-green/10 text-sage-green text-xs font-bold rounded-full uppercase">
                                        Disponible
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-stone-800 mb-4">{coupon.title}</h3>

                            {!coupon.redeemed && (
                                <button
                                    onClick={() => redeemCoupon(coupon.id)}
                                    className="w-full py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 active:scale-95 transition-all"
                                >
                                    Canjear Cupón
                                </button>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};
