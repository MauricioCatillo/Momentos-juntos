import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Check, CheckCheck, Heart, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { useHaptic } from '../hooks/useHaptic';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { sendPushNotification } from '../utils/notifications';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read: boolean;
}

export const Chat: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const { trigger } = useHaptic();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (error) throw error;
                setMessages(data || []);
            } catch (error) {
                console.error('Error loading messages:', error);
            } finally {
                setLoading(false);
            }
        };

        void loadMessages();
    }, []);

    useEffect(() => {
        const markAsRead = async () => {
            if (!user) return;

            const unreadMessages = messages.filter((message) => message.sender_id !== user.id && !message.read);
            if (unreadMessages.length === 0) return;

            try {
                await supabase
                    .from('messages')
                    .update({ read: true })
                    .in('id', unreadMessages.map((message) => message.id));
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        };

        void markAsRead();
    }, [messages, user]);

    useEffect(() => {
        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const message = payload.new as Message;
                    setMessages((prev) => [...prev, message]);

                    if (message.sender_id !== user?.id) {
                        trigger('medium');
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                (payload) => {
                    const updatedMessage = payload.new as Message;
                    setMessages((prev) =>
                        prev.map((message) => (message.id === updatedMessage.id ? updatedMessage : message))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, trigger]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newMessage.trim() || !user || sending) return;

        setSending(true);
        trigger('light');

        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase.from('messages').insert([
                {
                    content: messageContent,
                    sender_id: user.id,
                    read: false,
                },
            ]);

            if (error) throw error;
            trigger('success');

            sendPushNotification(`Nuevo mensaje: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`);
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent);
            trigger('error');
        } finally {
            setSending(false);
        }
    };

    const formatMessageDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return 'Hoy';
        if (isYesterday(date)) return 'Ayer';
        return format(date, "d 'de' MMMM", { locale: es });
    };

    const formatMessageTime = (dateString: string) => format(new Date(dateString), 'HH:mm');

    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.created_at);
        if (!groups[date]) groups[date] = [];
        groups[date].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    return (
        <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(253,247,244,0.95)_0%,rgba(248,233,239,0.88)_100%)] dark:bg-[linear-gradient(180deg,rgba(18,15,21,0.96)_0%,rgba(24,21,30,0.92)_100%)]">
            <header className="relative z-10 border-b border-white/65 bg-white/60 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-2xl dark:border-white/8 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => {
                            trigger('light');
                            navigate('/');
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-stone-600 shadow-sm transition-colors hover:text-rose-500 dark:bg-white/8 dark:text-stone-300"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-rose-500 to-pink-400 text-white shadow-lg shadow-rose-500/30">
                            <Heart className="h-6 w-6 fill-white" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Chat privado</p>
                            <h1 className="display-font text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                Mi amor
                            </h1>
                        </div>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-stone-500 shadow-sm dark:bg-white/8 dark:text-stone-300">
                        <Phone size={18} />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="rounded-full bg-white/70 px-4 py-3 text-sm text-stone-500 shadow-sm dark:bg-white/6 dark:text-stone-300">
                            Cargando mensajes...
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/70 text-rose-500 shadow-[0_20px_38px_rgba(116,62,79,0.14)] dark:bg-white/6 dark:text-rose-200">
                            <Heart className="h-9 w-9 fill-current" />
                        </div>
                        <h2 className="display-font mt-5 text-[2.2rem] leading-none text-stone-900 dark:text-stone-100">
                            Todavia no hay mensajes
                        </h2>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                            <div key={date}>
                                <div className="my-4 flex items-center justify-center">
                                    <span className="rounded-full border border-white/75 bg-white/65 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-stone-500 shadow-sm dark:border-white/8 dark:bg-white/5 dark:text-stone-300">
                                        {date}
                                    </span>
                                </div>

                                <AnimatePresence>
                                    {dateMessages.map((message, index) => {
                                        const isOwn = message.sender_id === user?.id;
                                        const showAvatar = index === 0 || dateMessages[index - 1].sender_id !== message.sender_id;

                                        return (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className={`mb-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex max-w-[84%] items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                    {!isOwn && (
                                                        <div className="flex h-7 w-7 items-center justify-center">
                                                            {showAvatar && (
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                                                                    <Heart className="h-3.5 w-3.5 fill-current" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`rounded-[1.35rem] px-4 py-3 shadow-sm ${isOwn
                                                            ? 'rounded-br-md bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/25'
                                                            : 'rounded-bl-md border border-white/70 bg-white/75 text-stone-800 dark:border-white/10 dark:bg-white/6 dark:text-stone-100'
                                                            }`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                                                        <div className={`mt-2 flex items-center gap-1 text-[0.65rem] ${isOwn ? 'justify-end text-white/72' : 'text-stone-400'}`}>
                                                            <span>{formatMessageTime(message.created_at)}</span>
                                                            {isOwn && (
                                                                <span>
                                                                    {message.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <form
                onSubmit={sendMessage}
                className="border-t border-white/65 bg-white/70 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl dark:border-white/8 dark:bg-white/5"
            >
                <div className="flex items-end gap-2">
                    <div className="flex-1 rounded-[1.7rem] border border-white/70 bg-white/80 px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/8">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(event) => setNewMessage(event.target.value)}
                            placeholder="Escribe algo bonito..."
                            className="w-full border-none bg-transparent px-0 py-1 text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
                            disabled={sending}
                        />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        whileTap={{ scale: 0.95 }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 transition-opacity disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send size={18} />
                    </motion.button>
                </div>
            </form>
        </div>
    );
};
