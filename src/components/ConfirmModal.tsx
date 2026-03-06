import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
}) => {
    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-200',
            button: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-200',
            button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        },
        info: {
            icon: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-backdrop z-[100]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        className="modal-card"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h3 className="display-font text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            {title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
                            {message}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button onClick={onClose} className="secondary-button px-4">
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`primary-button px-4 shadow-none ${styles.button}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
