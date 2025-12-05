import { supabase } from '../supabaseClient';

/**
 * Get the partner's Player ID (the other user in the couple)
 */
const getPartnerPlayerId = async (currentUserId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('player_ids')
        .select('player_id')
        .neq('user_id', currentUserId)
        .limit(1)
        .single();

    if (error || !data) {
        console.error('Could not find partner Player ID:', error);
        return null;
    }

    return data.player_id;
};

/**
 * Send a push notification to the partner
 */
export const sendPushNotification = async (message: string): Promise<void> => {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user');
            return;
        }

        // Get partner's Player ID
        const partnerPlayerId = await getPartnerPlayerId(user.id);
        if (!partnerPlayerId) {
            console.error('No partner Player ID found');
            return;
        }

        // Send notification via Edge Function
        const { error } = await supabase.functions.invoke('push-notification', {
            body: {
                message,
                heading: 'Mi Prometida 💌',
                player_id: partnerPlayerId // Target specific device
            }
        });

        if (error) {
            console.error('Supabase Function Error:', error);
            throw error;
        }

    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};
