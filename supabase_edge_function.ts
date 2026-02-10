// Supabase Edge Function: push-notification
// Deploy this to your Supabase project

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ONE_SIGNAL_APP_ID = Deno.env.get('ONE_SIGNAL_APP_ID');
const ONE_SIGNAL_API_KEY = Deno.env.get('ONE_SIGNAL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN');

const buildCorsHeaders = (origin: string) => ({
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN || origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const authenticateUser = async (req: Request): Promise<boolean> => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            Authorization: authHeader,
            apikey: SUPABASE_ANON_KEY,
        },
    });

    return response.ok;
};

serve(async (req) => {
    const origin = req.headers.get('origin') || '';
    const corsHeaders = buildCorsHeaders(origin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
        });
    }

    if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) {
        return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
        return new Response(JSON.stringify({ error: 'Missing OneSignal environment variables' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    const isAuthenticated = await authenticateUser(req);
    if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    try {
        const body = await req.json();

        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const heading = typeof body.heading === 'string' ? body.heading.trim() : 'Mi Prometida';
        const playerId = typeof body.player_id === 'string' ? body.player_id.trim() : '';

        if (!playerId) {
            return new Response(JSON.stringify({ error: 'player_id is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        if (!message) {
            return new Response(JSON.stringify({ error: 'message is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const payload = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [playerId],
            contents: { en: message.slice(0, 140) },
            headings: { en: heading.slice(0, 60) },
            priority: 10,
            android_visibility: 1,
        };

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: `Key ${ONE_SIGNAL_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.ok ? 200 : response.status,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid request';
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
