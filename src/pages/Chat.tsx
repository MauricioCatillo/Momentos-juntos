import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
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

    // Load messages
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

        loadMessages();
    }, []);

    // Mark messages as read when viewing
    useEffect(() => {
        const markAsRead = async () => {
            if (!user) return;

            const unreadMessages = messages.filter(
                m => m.sender_id !== user.id && !m.read
            );

            if (unreadMessages.length === 0) return;

            try {
                await supabase
                    .from('messages')
                    .update({ read: true })
                    .in('id', unreadMessages.map(m => m.id));
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        };

        markAsRead();
    }, [messages, user]);

    // Subscribe to real-time messages
    useEffect(() => {
        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => [...prev, newMsg]);

                    // Haptic feedback for incoming message
                    if (newMsg.sender_id !== user?.id) {
                        trigger('medium');
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                (payload) => {
                    const updatedMsg = payload.new as Message;
                    setMessages(prev =>
                        prev.map(m => m.id === updatedMsg.id ? updatedMsg : m)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, trigger]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
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
                }
            ]);

            if (error) throw error;
            trigger('success');

            // Send push notification to partner
            sendPushNotification(`💬 ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`);
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent); // Restore message on error
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

    const formatMessageTime = (dateString: string) => {
        return format(new Date(dateString), 'HH:mm');
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.created_at);
        if (!groups[date]) groups[date] = [];
        groups[date].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-stone-800/80 backdrop-blur-lg border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10">
                <button
                    onClick={() => {
                        trigger('light');
                        navigate('/');
                    }}
                    className="p-2 -ml-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-lg">
                        💕
                    </div>
                    <div>
                        <h1 className="font-bold text-stone-800 dark:text-stone-100">Mi Amor</h1>
                        <p className="text-xs text-stone-500 dark:text-stone-400">Nuestro chat privado</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-stone-400">Cargando mensajes...</div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-6xl mb-4">💌</div>
                        <p className="text-stone-500 dark:text-stone-400">
                            Aún no hay mensajes.<br />
                            ¡Envía el primero!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                            <div key={date}>
                                {/* Date Separator */}
                                <div className="flex items-center justify-center my-4">
                                    <span className="text-xs text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
                                        {date}
                                    </span>
                                </div>

                                {/* Messages for this date */}
                                <AnimatePresence>
                                    {dateMessages.map((message, index) => {
                                        const isOwn = message.sender_id === user?.id;
                                        const showAvatar = index === 0 ||
                                            dateMessages[index - 1].sender_id !== message.sender_id;

                                        return (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                                            >
                                                <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                    {/* Avatar placeholder for alignment */}
                                                    {!isOwn && (
                                                        <div className={`w-6 h-6 rounded-full ${showAvatar ? 'bg-rose-400 text-white text-xs flex items-center justify-center' : ''}`}>
                                                            {showAvatar && '❤️'}
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`px-4 py-2 rounded-2xl ${isOwn
                                                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-sm'
                                                            : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-bl-sm shadow-sm border border-stone-100 dark:border-stone-700'
                                                            }`}
                                                    >
                                                        <p className="text-sm whitespace-pre-wrap break-words">
                                                            {message.content}
                                                        </p>
                                                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                                            <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-stone-400'}`}>
                                                                {formatMessageTime(message.created_at)}
                                                            </span>
                                                            {isOwn && (
                                                                <span className="text-white/70">
                                                                    {message.read ? (
                                                                        <CheckCheck size={12} />
                                                                    ) : (
                                                                        <Check size={12} />
                                                                    )}
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

            {/* Input */}
            <form
                onSubmit={sendMessage}
                className="p-4 bg-white/80 dark:bg-stone-800/80 backdrop-blur-lg border-t border-stone-200 dark:border-stone-700"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-4 py-3 bg-stone-100 dark:bg-stone-700 rounded-full text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 transition-all"
                        disabled={sending}
                    />
                    <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        <Send size={20} />
                    </motion.button>
                </div>
            </form>
        </div>
    );
};
