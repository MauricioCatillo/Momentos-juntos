import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdunaxuelvzzpzhvgvcm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdW5heHVlbHZ6enB6aHZndmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzExOTgsImV4cCI6MjA3OTYwNzE5OH0.fDPcGFFmNGAY09xasV4jeitoK9AIs90bFKSleoM-QuM';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const uploadMemory = async (
    file: File | null,
    title: string,
    description: string,
    date: string,
    folder_id?: string,
    externalUrl?: string
) => {
    try {
        let publicUrl = '';
        let mediaType = 'image';

        if (externalUrl) {
            // Case: External Drive Video
            publicUrl = ''; // No media_url for external videos, we use external_url
            mediaType = 'video';
        } else if (file) {
            // Case: File Upload
            // Check file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error("El archivo es demasiado grande. El límite es 50MB.");
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('couple_uploads')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl: url } } = supabase.storage
                .from('couple_uploads')
                .getPublicUrl(filePath);

            publicUrl = url;
            mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        } else {
            throw new Error("Debes proporcionar un archivo o un enlace externo.");
        }

        // Insert into DB
        const { data, error: dbError } = await supabase
            .from('memories')
            .insert([
                {
                    title,
                    description,
                    date: new Date(date).toISOString(),
                    media_url: publicUrl,
                    external_url: externalUrl || null,
                    media_type: mediaType,
                    folder_id: folder_id || null
                }
            ])
            .select()
            .single();

        if (dbError) throw dbError;

        return data;
    } catch (error) {
        console.error('Error uploading memory:', error);
        throw error;
    }
};

export const updateMemory = async (id: string, updates: { title?: string; description?: string; date?: string }) => {
    const { data, error } = await supabase
        .from('memories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- New Features Helpers ---

export const getAppSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) throw error;
    return data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
};

export const updateAppSetting = async (key: string, value: any) => {
    const { error } = await supabase.from('app_settings').upsert({ key, value });
    if (error) throw error;
};

export const getNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const addNote = async (content: string, color: string = 'yellow', author: string = 'user') => {
    const { data, error } = await supabase.from('notes').insert([{ content, color, author }]).select().single();
    if (error) throw error;
    return data;
};

export const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().match({ id });
    if (error) throw error;
};

// --- Folders Helpers ---

export const createFolder = async (name: string, parentId?: string) => {
    const { data, error } = await supabase.from('folders').insert([{ name, parent_id: parentId }]).select().single();
    if (error) throw error;
    return data;
};

export const updateFolder = async (id: string, name: string) => {
    const { data, error } = await supabase.from('folders').update({ name }).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const getFolders = async (parentId?: string) => {
    let query = supabase.from('folders').select('*').order('created_at', { ascending: true });

    if (parentId) {
        query = query.eq('parent_id', parentId);
    } else {
        query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getMemories = async (folderId?: string) => {
    let query = supabase.from('memories').select('*').order('date', { ascending: false });

    if (folderId) {
        query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const deleteMemory = async (id: string) => {
    const { error } = await supabase.from('memories').delete().match({ id });
    if (error) throw error;
};

export const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('folders').delete().match({ id });
    if (error) throw error;
};
