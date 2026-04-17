export interface PreviewMessage {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read: boolean;
}

export interface PreviewMemory {
    id: string;
    title: string;
    description: string;
    date: string;
    created_at: string;
    media_type: 'image' | 'video';
    media_url?: string;
    external_url?: string;
    folder_id?: string | null;
}

export const PREVIEW_USER_ID = 'preview-user';
export const PREVIEW_PARTNER_ID = 'preview-partner';

export const PREVIEW_APP_SETTINGS = {};

export const PREVIEW_MESSAGES: PreviewMessage[] = [
    {
        id: 'preview-message-1',
        content: 'Ya llegue amor',
        sender_id: PREVIEW_PARTNER_ID,
        created_at: '2026-04-16T12:00:00.000Z',
        read: true,
    },
    {
        id: 'preview-message-2',
        content: 'Voy saliendo',
        sender_id: PREVIEW_USER_ID,
        created_at: '2026-04-16T12:04:00.000Z',
        read: true,
    },
];

export const PREVIEW_NOTES: {
    id: string;
    content: string;
    color: string;
    author: string;
    created_at: string;
}[] = [
    {
        id: 'preview-note-1',
        content: 'Compra tu snack favorito',
        color: 'bg-purple-200',
        author: PREVIEW_PARTNER_ID,
        created_at: '2026-04-16T11:00:00.000Z',
    },
    {
        id: 'preview-note-2',
        content: 'Mandarte las fotos de ayer',
        color: 'bg-rose-200',
        author: PREVIEW_USER_ID,
        created_at: '2026-04-15T19:30:00.000Z',
    },
];

export const PREVIEW_BUCKET_ITEMS: {
    id: string;
    text: string;
    description: string;
    category: string;
    completed: boolean;
    created_at: string;
}[] = [
    {
        id: 'preview-bucket-1',
        text: 'Escapada de fin de semana',
        description: '',
        category: 'Viajes',
        completed: false,
        created_at: '2026-04-10T10:00:00.000Z',
    },
];

export const PREVIEW_COUPONS: {
    id: string;
    title: string;
    redeemed: boolean;
    created_at: string;
}[] = [
    {
        id: 'preview-coupon-1',
        title: 'Vale por elegir la cita',
        redeemed: false,
        created_at: '2026-04-12T10:00:00.000Z',
    },
];

export const PREVIEW_MOODS: {
    id: string;
    date: string;
    mood: string;
    note: string;
}[] = [
    {
        id: 'preview-mood-1',
        date: '2026-04-16T08:00:00.000Z',
        mood: 'happy',
        note: 'Todo bien',
    },
];

export const PREVIEW_MILESTONES: {
    id: string;
    title: string;
    date: string;
    description: string;
}[] = [
    {
        id: 'preview-milestone-1',
        title: 'Primera salida',
        date: '2023-02-14T00:00:00.000Z',
        description: 'Cafe y paseo',
    },
];

export const PREVIEW_MEMORIES: PreviewMemory[] = [];
