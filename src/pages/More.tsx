import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck2, ListTodo, MessageSquareText, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StickyNotes } from '../components/StickyNotes';
import { PageHeader } from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';

const MoreCard = ({
    title,
    description,
    helper,
    gradient,
    icon: Icon,
    onClick,
}: {
    title: string;
    description: string;
    helper: string;
    gradient: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-[0_20px_42px_rgba(84,48,61,0.16)]`}
    >
        <div className="absolute right-[-1.2rem] top-[-1.2rem] h-24 w-24 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/75">Acceso</p>
                    <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <Icon size={20} />
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/82">{description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{helper}</p>
        </div>
    </motion.button>
);

export const More: React.FC = () => {
    const navigate = useNavigate();
    const { moods, bucketList, coupons } = useApp();
    const todayMood = moods.find((mood) => new Date(mood.date).toDateString() === new Date().toDateString());
    const pendingPlans = bucketList.filter((item) => !item.completed).length;
    const activeCoupons = coupons.filter((coupon) => !coupon.redeemed).length;

    return (
        <div className="page-shell">
            <PageHeader
                kicker="Mas"
                title="Herramientas utiles"
                subtitle="Todo lo que no necesitan ver siempre, pero si tener a mano."
            />

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Resumen rapido</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            Menos ruido, mas orden
                        </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-200">
                        <MessageSquareText size={20} />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-[1.35rem] border border-white/70 bg-white/65 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                        <p className="section-label">Check-in</p>
                        <p className="mt-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {todayMood ? 'Listo' : 'Pendiente'}
                        </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/70 bg-white/65 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                        <p className="section-label">Planes</p>
                        <p className="mt-3 text-2xl font-black text-stone-900 dark:text-stone-100">{pendingPlans}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/70 bg-white/65 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                        <p className="section-label">Cupones</p>
                        <p className="mt-3 text-2xl font-black text-stone-900 dark:text-stone-100">{activeCoupons}</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-3">
                <MoreCard
                    title="Check-in diario"
                    description="Registrar como estan hoy y dejar una nota corta sin darle una pantalla principal."
                    helper={todayMood ? 'Ya se registro hoy' : 'Falta registrar hoy'}
                    gradient="from-sky-500 to-cyan-500"
                    icon={CalendarCheck2}
                    onClick={() => navigate('/daily')}
                />
                <MoreCard
                    title="Planes y cupones"
                    description="Wishlist, tareas pendientes y cupones compartidos en un mismo lugar secundario."
                    helper={`${pendingPlans} planes pendientes y ${activeCoupons} cupones activos`}
                    gradient="from-violet-500 to-indigo-500"
                    icon={ListTodo}
                    onClick={() => navigate('/wishlist')}
                />
            </section>

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Notas</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            Pendientes compartidos
                        </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                        <StickyNote size={20} />
                    </div>
                </div>

                <StickyNotes showPushNotification={true} title="Notas compartidas" />
            </section>
        </div>
    );
};
