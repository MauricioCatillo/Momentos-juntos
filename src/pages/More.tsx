import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellRing, CalendarCheck2, ListTodo, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StickyNotes } from '../components/StickyNotes';
import { PageHeader } from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { requestPushPermission } from '../utils/notifications';
import { isPreviewModeEnabled } from '../lib/previewMode';

const UtilityCard = ({
    title,
    helper,
    gradient,
    icon: Icon,
    onClick,
}: {
    title: string;
    helper: string;
    gradient: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-[0_18px_42px_rgba(48,31,22,0.18)]`}
    >
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/12 blur-2xl" />
        <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/70">Acceso</p>
                    <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <Icon size={20} />
                </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/78">{helper}</p>
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
                kicker="Mas"
                title="Herramientas utiles"
                subtitle="Todo lo operativo, claro y rapido desde el celular."
            />

            <section className="hero-panel">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="hero-kicker">Centro de control</p>
                        <h2 className="display-font mt-3 text-[2.5rem] leading-[0.94] text-white">
                            Menos ruido, mas orden.
                        </h2>
                    </div>
                    <div className="hero-chip shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/88">
                        <MessageSquareText size={12} />
                        Resumen
                    </div>
                </div>

                <p className="mt-4 max-w-[16rem] text-sm leading-6 text-white/78">
                    Desde aqui puedes revisar pendientes, permisos y accesos utiles sin perder tiempo.
                </p>

                <div className="mt-5 metric-strip">
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Check-in</p>
                        <p className="mt-2 text-base font-semibold text-white">{todayMood ? 'Listo' : 'Pendiente'}</p>
                    </div>
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Planes</p>
                        <p className="mt-2 text-base font-semibold text-white">{pendingPlans}</p>
                    </div>
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Cupones</p>
                        <p className="mt-2 text-base font-semibold text-white">{activeCoupons}</p>
                    </div>
                </div>
            </section>

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="section-label">Notificaciones</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                            {notificationUi.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                            {notificationUi.description}
                        </p>
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
                <UtilityCard
                    title="Check-in diario"
                    helper={todayMood ? 'Ya se registro hoy.' : 'Todavia falta registrar el estado de hoy.'}
                    gradient="from-[#254940] via-[#477366] to-[#82ad97]"
                    icon={CalendarCheck2}
                    onClick={() => navigate('/daily')}
                />
                <UtilityCard
                    title="Planes y cupones"
                    helper={`${pendingPlans} planes pendientes y ${activeCoupons} cupones activos ahora mismo.`}
                    gradient="from-[#5b3651] via-[#8a5573] to-[#c693ab]"
                    icon={ListTodo}
                    onClick={() => navigate('/wishlist')}
                />
            </section>

            <StickyNotes
                showPushNotification={true}
                title="Pendientes compartidos"
                subtitle="Si quieren dejarse recordatorios o mensajes rapidos, este sigue siendo su segundo acceso mas directo."
            />
        </div>
    );
};
