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

export const uploadMemory = async (file: File, title: string, description: string, date: string, folder_id?: string) => {
    try {
        // 1. Upload image
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('couple_uploads')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('couple_uploads')
            .getPublicUrl(filePath);

        // 3. Insert into DB
        const { data, error: dbError } = await supabase
            .from('memories')
            .insert([
                {
                    title,
                    description,
                    date: new Date(date).toISOString(), // Ensure date format matches if needed, or just string
                    media_url: publicUrl,
                    media_type: file.type.startsWith('video/') ? 'video' : 'image',
                    author: 'user', // Placeholder
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

export const createFolder = async (name: string) => {
    const { data, error } = await supabase.from('folders').insert([{ name }]).select().single();
    if (error) throw error;
    return data;
};

export const getFolders = async () => {
    const { data, error } = await supabase.from('folders').select('*').order('created_at', { ascending: true });
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
