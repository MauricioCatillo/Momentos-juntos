import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
    it('renders when open', () => {
        render(
            <ConfirmModal
                isOpen={true}
                onClose={() => { }}
                onConfirm={() => { }}
                title="Confirmar acción"
                message="¿Estás seguro?"
            />
        );

        expect(screen.getByText('Confirmar acción')).toBeInTheDocument();
        expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
        expect(screen.getByText('Confirmar')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <ConfirmModal
                isOpen={false}
                onClose={() => { }}
                onConfirm={() => { }}
                title="Confirmar acción"
                message="¿Estás seguro?"
            />
        );

        expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument();
    });

    it('uses custom button text', () => {
        render(
            <ConfirmModal
                isOpen={true}
                onClose={() => { }}
                onConfirm={() => { }}
                title="Borrar"
                message="¿Deseas borrar este elemento?"
                confirmText="Sí, borrar"
                cancelText="No, volver"
            />
        );

        expect(screen.getByText('Sí, borrar')).toBeInTheDocument();
        expect(screen.getByText('No, volver')).toBeInTheDocument();
    });
});
