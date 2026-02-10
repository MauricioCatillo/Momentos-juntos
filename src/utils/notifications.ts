import OneSignal from 'react-onesignal';
import { supabase } from '../supabaseClient';

/**
 * Get the partner player ID (the most recently updated ID from another user)
 */
const getPartnerPlayerId = async (currentUserId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('player_ids')
        .select('player_id, user_id, updated_at')
        .neq('user_id', currentUserId)
        .not('player_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data?.player_id) {
        console.error('[Notification] Could not find partner Player ID:', error);
        return null;
    }

    return data.player_id;
};

/**
 * Send a push notification to the partner
 */
export const sendPushNotification = async (message: string): Promise<void> => {
    try {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        const safeMessage = trimmedMessage.slice(0, 140);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            console.error('[Notification] No authenticated user');
            return;
        }

        const partnerPlayerId = await getPartnerPlayerId(user.id);
        if (!partnerPlayerId) {
            console.warn('[Notification] No partner Player ID found yet');
            return;
        }

        const { error } = await supabase.functions.invoke('push-notification', {
            body: {
                message: safeMessage,
                heading: 'Mi Prometida',
                player_id: partnerPlayerId,
            },
        });

        if (error) {
            console.error('[Notification] Supabase Function Error:', error);
            throw error;
        }
    } catch (error) {
        console.error('[Notification] Error sending notification:', error);
        throw error;
    }
};

export const requestPushPermission = async (): Promise<boolean> => {
    try {
        await OneSignal.Slidedown.promptPush();
        return true;
    } catch (error) {
        console.error('[Notification] Error requesting push permission:', error);
        return false;
    }
};
