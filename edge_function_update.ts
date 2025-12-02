import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ONE_SIGNAL_APP_ID = "b1cec79b-98e6-4881-ae74-8b626d302e15"
const ONE_SIGNAL_API_KEY = "os_v2_app_whhmpg4y4zeidlturnrg2mbocxrrhqraezfuzvf6giqkftozkgxivm6wcmyofzafi6kuahyxubw4n2ahjgp2txen3nq5xrcg7r7zmoa"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, heading, priority } = await req.json()

        const payload = {
            app_id: ONE_SIGNAL_APP_ID,
            contents: { en: message },
            headings: { en: heading || "Mi Prometida 💌" },
            priority: priority || 10,
            // Android specific settings for high priority
            android_channel_id: "e4f8d9a0-1c2b-4e5f-9a0b-1c2d3e4f5a6b", // Optional: OneSignal default
            android_priority: 10,
            android_visibility: 1, // Public (show on lock screen)
            // iOS settings
            ios_sound: "default",
            // Target all users (since it's a couple's app)
            included_segments: ["Total Subscriptions"]
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
