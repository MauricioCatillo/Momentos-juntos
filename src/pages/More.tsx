import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellRing, CalendarCheck2, ListTodo, MessageSquareText, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StickyNotes } from '../components/StickyNotes';
import { PageHeader } from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { requestPushPermission } from '../utils/notifications';
import { isPreviewModeEnabled } from '../lib/previewMode';

const MoreCard = ({
    title,
    gradient,
    icon: Icon,
    onClick,
}: {
    title: string;
    gradient: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-[0_20px_42px_rgba(0,0,0,0.2)]`}
    >
        <div className="absolute right-[-1.2rem] top-[-1.2rem] h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold">{title}</h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <Icon size={20} />
                </div>
            </div>
        </div>
    </motion.button>
);

export const More: React.FC = () => {
    const navigate = useNavigate();
    const { moods, bucketList, coupons } = useApp();
    const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const todayMood = moods.find((mood) => new Date(mood.date).toDateString() === new Date().toDateString());
    const pendingPlans = bucketList.filter((item) => !item.completed).length;
    const activeCoupons = coupons.filter((coupon) => !coupon.redeemed).length;
    const previewMode = isPreviewModeEnabled();

    useEffect(() => {
        const syncPermission = () => {
            if (previewMode) {
                setNotificationPermission('default');
                return;
            }

            if (typeof window === 'undefined' || !('Notification' in window)) {
                setNotificationPermission('unsupported');
                return;
            }

            setNotificationPermission(window.Notification.permission);
        };

        syncPermission();

        window.addEventListener('focus', syncPermission);
        document.addEventListener('visibilitychange', syncPermission);

        return () => {
            window.removeEventListener('focus', syncPermission);
            document.removeEventListener('visibilitychange', syncPermission);
        };
    }, [previewMode]);

    const handleEnableNotifications = async () => {
        if (isEnablingNotifications || notificationPermission === 'granted') return;

        setIsEnablingNotifications(true);

        try {
            const granted = await requestPushPermission();

            if (!granted) {
                toast.error('No se pudieron activar las notificaciones.');
                if (typeof window !== 'undefined' && 'Notification' in window) {
                    setNotificationPermission(window.Notification.permission);
                }
                return;
            }

            setNotificationPermission('granted');
            toast.success('Notificaciones activadas.');
        } finally {
            setIsEnablingNotifications(false);
        }
    };

    const notificationUi = useMemo(() => {
        if (notificationPermission === 'granted') {
            return {
                title: 'Ya estan activadas',
                description: 'Tu celular ya puede recibir avisos del chat y de las notas.',
                buttonText: 'Notificaciones activadas',
                disabled: true,
                icon: BellRing,
            };
        }

        if (notificationPermission === 'denied') {
            return {
                title: 'Permiso bloqueado',
                description: 'Necesitas volver a habilitarlas desde la configuracion del navegador.',
                buttonText: 'Permiso bloqueado',
                disabled: true,
                icon: Bell,
            };
        }

        if (notificationPermission === 'unsupported') {
            return {
                title: 'No disponibles aqui',
                description: 'Este navegador no expone permisos de notificacion para la app.',
                buttonText: 'No disponible',
                disabled: true,
                icon: Bell,
            };
        }

        return {
            title: 'Activalas una vez',
            description: 'Permite avisos del chat y de las notas en tu celular.',
            buttonText: isEnablingNotifications ? 'Activando...' : 'Activar notificaciones',
            disabled: false,
            icon: Bell,
        };
    }, [isEnablingNotifications, notificationPermission]);

    const NotificationIcon = notificationUi.icon;

    return (
        <div className="page-shell">
            <PageHeader
                title="Mas"
            />

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="display-font text-[2rem] leading-none text-[color:var(--text-primary)]">
                            Resumen
                        </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-400 dark:bg-sky-500/10">
                        <MessageSquareText size={20} />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <p className="section-label">Check-in</p>
                        <p className="mt-3 text-sm font-semibold text-[color:var(--text-primary)]">
                            {todayMood ? 'Listo' : 'Pendiente'}
                        </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <p className="section-label">Planes</p>
                        <p className="mt-3 text-2xl font-black text-[color:var(--text-primary)]">{pendingPlans}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <p className="section-label">Cupones</p>
                        <p className="mt-3 text-2xl font-black text-[color:var(--text-primary)]">{activeCoupons}</p>
                    </div>
                </div>
            </section>

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Notificaciones</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                            {notificationUi.title}
                        </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-400 dark:bg-amber-500/10">
                        <NotificationIcon size={20} />
                    </div>
                </div>

                <button
                    onClick={() => void handleEnableNotifications()}
                    disabled={isEnablingNotifications || notificationUi.disabled}
                    className="primary-button mt-5 flex w-full items-center justify-center gap-2 disabled:opacity-60"
                >
                    <NotificationIcon size={16} />
                    {notificationUi.buttonText}
                </button>
            </section>

            <section className="grid gap-3">
                <MoreCard
                    title="Check-in diario"
                    gradient="from-sky-500 to-cyan-600"
                    icon={CalendarCheck2}
                    onClick={() => navigate('/daily')}
                />
                <MoreCard
                    title="Planes y cupones"
                    gradient="from-violet-500 to-indigo-600"
                    icon={ListTodo}
                    onClick={() => navigate('/wishlist')}
                />
            </section>

            <StickyNotes showPushNotification={true} title="Notas" />
        </div>
    );
};
