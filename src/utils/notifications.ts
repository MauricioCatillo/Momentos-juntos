import { supabase } from '../supabaseClient';

export const sendPushNotification = async (message: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('push-notification', {
            body: {
                message,
                heading: 'Mi Prometida 💌',
                priority: 10
            }
        });

        if (error) {
            console.error('Supabase Function Error:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};
