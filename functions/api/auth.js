import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
        const { action, email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Missing email or password' }), {
                status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        if (action === 'signup') {
            // Check if user exists
            const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
            if (existing) {
                return new Response(JSON.stringify({ error: 'User already exists' }), {
                    status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Create user
            const { data, error } = await supabase.from('users').insert([{
                email,
                password_hash: passwordHash
            }]).select().single();

            if (error) throw error;

            // Generate Token
            const token = await generateToken(data.id, email, env.VITE_SUPABASE_ANON_KEY);

            return new Response(JSON.stringify({ token, user: { id: data.id, email: data.email } }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (action === 'login') {
            const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

            if (error || !user || user.password_hash !== passwordHash) {
                return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                    status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            const token = await generateToken(user.id, user.email, env.VITE_SUPABASE_ANON_KEY);

            return new Response(JSON.stringify({ token, user: { id: user.id, email: user.email } }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response('Invalid action', { status: 400, headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// Helpers
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateToken(userId, email, secret) {
    // Simple JWT-like signature
    const header = { alg: "HS256", typ: "JWT" };
    const payload = { sub: userId, email, exp: Date.now() + (24 * 60 * 60 * 1000) }; // 24h

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return `${encodedHeader}.${encodedPayload}.${encodedSignature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
}
