// Supabase Edge Function: push-notification
// Deploy this to your Supabase project

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ONE_SIGNAL_APP_ID = "b1cec79b-98e6-4881-ae74-8b626d302e15"
const ONE_SIGNAL_API_KEY = "os_v2_app_whhmpg4y4zeidlturnrg2mbocxrrhqraezfuzvf6giqkftozkgxivm6wcmyofzafi6kuahyxubw4n2ahjgp2txen3nq5xrcg7r7zmoa"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, heading, player_id } = await req.json()

        // Validate required fields
        if (!player_id) {
            return new Response(
                JSON.stringify({ error: 'player_id is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const payload = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [player_id], // Target specific device
            contents: { en: message },
            headings: { en: heading || "Mi Prometida 💌" },
            // High priority for Android
            priority: 10,
            android_visibility: 1,
        }

        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Key ${ONE_SIGNAL_API_KEY}`
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
