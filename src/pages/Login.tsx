import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

const SAVED_EMAIL_KEY = 'mi-prometida-saved-email';

export const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login, signup } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = window.localStorage.getItem(SAVED_EMAIL_KEY);
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const normalizedEmail = email.trim();

            if (isLogin) {
                await login(normalizedEmail, password);
                window.localStorage.setItem(SAVED_EMAIL_KEY, normalizedEmail);
                navigate('/');
                return;
            }

            await signup(normalizedEmail, password);
            window.localStorage.setItem(SAVED_EMAIL_KEY, normalizedEmail);
            toast.success('Cuenta creada. Ahora inicia sesion.');
            setIsLogin(true);
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Ocurrio un error. Revisa tus datos.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen min-h-[100dvh] overflow-hidden px-4 py-5 sm:px-6">
            <div className="pointer-events-none absolute left-[-4rem] top-[-3rem] h-52 w-52 rounded-full bg-[rgba(210,130,88,0.22)] blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-64 w-64 rounded-full bg-[rgba(113,152,128,0.18)] blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[28rem] flex-col justify-center rounded-[2.2rem] border border-[rgba(100,71,49,0.08)] bg-[rgba(255,252,247,0.9)] p-5 shadow-[0_30px_80px_rgba(88,56,34,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(24,20,17,0.92)]">
                <motion.section
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="section-card rounded-[1.9rem] p-4 sm:p-5"
                >
                    <div className="pill-toggle mb-4 grid w-full grid-cols-2">
                        <button
                            type="button"
                            className={isLogin ? 'is-active' : ''}
                            onClick={() => {
                                setIsLogin(true);
                                setError(null);
                            }}
                        >
                            Iniciar sesion
                        </button>
                        <button
                            type="button"
                            className={!isLogin ? 'is-active' : ''}
                            onClick={() => {
                                setIsLogin(false);
                                setError(null);
                            }}
                        >
                            Crear cuenta
                        </button>
                    </div>

                    <div className="mb-5">
                        <img
                            src="/icon-192.png"
                            alt="Mi Prometida"
                            className="h-14 w-14 rounded-[1.4rem] shadow-lg"
                        />
                        <div className="mt-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Mi Prometida</p>
                                <h1 className="display-font mt-2 text-[2.25rem] leading-none text-stone-900 dark:text-stone-100">
                                    {isLogin ? 'Entrar' : 'Crear cuenta'}
                                </h1>
                            </div>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-stone-700 shadow-sm dark:bg-white/8 dark:text-stone-200">
                            <ShieldCheck size={14} />
                            Acceso persistente
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <label className="block">
                            <span className="section-label mb-2 block">Correo</span>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center text-stone-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="tu-correo@ejemplo.com"
                                    className="input-shell has-icon text-base leading-none"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="section-label mb-2 block">Contrasena</span>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center text-stone-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Escribe tu contrasena"
                                    className="input-shell has-icon text-base leading-none"
                                />
                            </div>
                        </label>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="primary-button inline-flex w-full items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    {isLogin ? 'Entrar' : 'Crear cuenta'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.section>
            </div>
        </div>
    );
};
