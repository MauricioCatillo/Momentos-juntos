import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-900 p-4 text-center">
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">
                        ¡Ups! Algo salió mal.
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-8">
                        No pudimos cargar esta sección. Puede ser un problema de conexión.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors shadow-lg"
                    >
                        <RefreshCw size={20} />
                        Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
