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

export const PREVIEW_MESSAGES: PreviewMessage[] = [];

export const PREVIEW_NOTES: {
    id: string;
    content: string;
    color: string;
    author: string;
    created_at: string;
}[] = [];

export const PREVIEW_BUCKET_ITEMS: {
    id: string;
    text: string;
    description: string;
    category: string;
    completed: boolean;
    created_at: string;
}[] = [];

export const PREVIEW_COUPONS: {
    id: string;
    title: string;
    redeemed: boolean;
    created_at: string;
}[] = [];

export const PREVIEW_MOODS: {
    id: string;
    date: string;
    mood: string;
    note: string;
}[] = [];

export const PREVIEW_MILESTONES: {
    id: string;
    title: string;
    date: string;
    description: string;
}[] = [];

export const PREVIEW_MEMORIES: PreviewMemory[] = [];
