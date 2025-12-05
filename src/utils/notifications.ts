import { supabase } from '../supabaseClient';

/**
 * Get the partner's Player ID (the other user in the couple)
 */
const getPartnerPlayerId = async (currentUserId: string): Promise<string | null> => {
    console.log('[Notification] Looking for partner. Current user:', currentUserId);

    const { data, error } = await supabase
        .from('player_ids')
        .select('player_id, user_id')
        .neq('user_id', currentUserId);

    console.log('[Notification] Partner query result:', { data, error });

    if (error || !data || data.length === 0) {
        console.error('[Notification] Could not find partner Player ID:', error);
        return null;
    }

    console.log('[Notification] Found partner Player ID:', data[0].player_id);
    return data[0].player_id;
};

/**
 * Send a push notification to the partner
 */
export const sendPushNotification = async (message: string): Promise<void> => {
    try {
        console.log('[Notification] Starting sendPushNotification...');

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[Notification] No authenticated user');
            return;
        }
        console.log('[Notification] Current user ID:', user.id);

        // Get partner's Player ID
        const partnerPlayerId = await getPartnerPlayerId(user.id);
        if (!partnerPlayerId) {
            console.error('[Notification] No partner Player ID found - make sure partner has opened the app');
            return;
        }

        console.log('[Notification] Sending to Edge Function with player_id:', partnerPlayerId);

        // Send notification via Edge Function
        const { data, error } = await supabase.functions.invoke('push-notification', {
            body: {
                message,
                heading: 'Mi Prometida 💌',
                player_id: partnerPlayerId
            }
        });

        console.log('[Notification] Edge Function response:', { data, error });

        if (error) {
            console.error('[Notification] Supabase Function Error:', error);
            throw error;
        }

    } catch (error) {
        console.error('[Notification] Error sending notification:', error);
        throw error;
    }
};
