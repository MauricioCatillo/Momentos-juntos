import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

export const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login, signup } = useApp();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await login(email, password);
                navigate('/');
                return;
            }

            await signup(email, password);
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
            <div className="pointer-events-none absolute left-[-4rem] top-[-4rem] h-48 w-48 rounded-full bg-rose-300/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-5rem] right-[-4rem] h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[28rem] flex-col gap-6 rounded-[2.2rem] border border-white/65 bg-[rgba(255,251,248,0.82)] p-5 shadow-[0_30px_80px_rgba(88,44,58,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(24,20,29,0.9)]">
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="space-y-4 pt-1"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-rose-500 to-pink-400 text-white shadow-lg shadow-rose-500/30">
                        <Heart className="h-7 w-7 fill-white" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">Mi Prometida</p>
                        <h1 className="display-font text-[2.65rem] leading-none text-stone-900 dark:text-stone-100">
                            {isLogin ? 'Entrar' : 'Crear cuenta'}
                        </h1>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.55 }}
                    className="section-card rounded-[1.9rem] p-4 sm:p-5"
                >
                    <div className="mb-4 grid w-full grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <button
                            type="button"
                            className={`min-h-[3rem] rounded-full px-4 text-sm font-semibold transition-all ${isLogin
                                ? 'bg-white/14 text-white shadow-[0_8px_22px_rgba(0,0,0,0.18)]'
                                : 'text-stone-300'
                                }`}
                            onClick={() => {
                                setIsLogin(true);
                                setError(null);
                            }}
                        >
                            Iniciar sesion
                        </button>
                        <button
                            type="button"
                            className={`min-h-[3rem] rounded-full px-4 text-sm font-semibold transition-all ${!isLogin
                                ? 'bg-white/14 text-white shadow-[0_8px_22px_rgba(0,0,0,0.18)]'
                                : 'text-stone-300'
                                }`}
                            onClick={() => {
                                setIsLogin(false);
                                setError(null);
                            }}
                        >
                            Crear cuenta
                        </button>
                    </div>

                    <div className="mb-5">
                        <h2 className="display-font text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            {isLogin ? 'Iniciar sesion' : 'Crear acceso'}
                        </h2>
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
