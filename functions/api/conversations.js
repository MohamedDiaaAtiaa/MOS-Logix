import { createClient } from '@supabase/supabase-js';

/**
 * Cloudflare Pages Function: /api/conversations
 * 
 * Admin API for viewing conversations and message history.
 * GET /api/conversations         — List all conversations
 * GET /api/conversations?id=UUID — Get messages for a specific conversation
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
}

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const conversationId = url.searchParams.get('id');
        const getStats = url.searchParams.get('stats');
        const getSites = url.searchParams.get('sites');
        const siteId = url.searchParams.get('site_id');

        // AUTH CHECK
        // We allow public access for 'getSites' (Showcase) and 'siteId' (Showcase Detail)
        // But 'getStats' and 'conversationId' require Admin Auth.

        const authHeader = request.headers.get('Authorization');
        const isPublicRequest = getSites === 'true' || (siteId && !authHeader);

        // Verify Auth if NOT public request
        if (!isPublicRequest) {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }
            const token = authHeader.split(' ')[1];

            // 1. Check Hardcoded Super Admin
            const isSuperAdmin = await verifyPassword(token, env);

            // 2. Check DB Admins if not Super Admin
            let isDbAdmin = false;
            // if (!isSuperAdmin) { isDbAdmin = await verifyDbAdmin(token, env); } 

            if (!isSuperAdmin && !isDbAdmin) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders });
            }
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // ─── STATS ─────────────────────────────────────────────────
        if (getStats) {
            const { count: aiCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'ai');

            const { count: webCount } = await supabase
                .from('website_generations')
                .select('*', { count: 'exact', head: true });

            return new Response(JSON.stringify({
                stats: {
                    ai_emails: aiCount || 0,
                    websites: webCount || 0
                }
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ─── SITES LIST ────────────────────────────────────────────
        if (getSites) {
            const { data: sites, error } = await supabase
                .from('website_generations')
                .select('id, prompt, created_at')
                .order('created_at', { ascending: false });

            return new Response(JSON.stringify({ sites: sites || [] }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ─── SINGLE SITE ───────────────────────────────────────────
        if (siteId) {
            const { data: site, error } = await supabase
                .from('website_generations')
                .select('*')
                .eq('id', siteId)
                .single();

            return new Response(JSON.stringify({ site }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ─── ADMINS LIST (GET) ─────────────────────────────────────
        if (url.searchParams.get('admins') === 'true') {
            // Only Super Admin can view/edit admins
            if (!isSuperAdmin) {
                return new Response(JSON.stringify({ error: 'Unauthorized: Super Admin only' }), { status: 403, headers: corsHeaders });
            }

            const { data: admins, error } = await supabase
                .from('admins')
                .select('id, username, created_at');

            return new Response(JSON.stringify({ admins: admins || [] }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ─── CONVERSATIONS ─────────────────────────────────────────
        // If an ID is provided, return the conversation with its messages
        if (conversationId) {
            // Get conversation details
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (convError || !conversation) {
                return new Response(JSON.stringify({ error: 'Conversation not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Get all messages
            const { data: messages, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (msgError) {
                throw new Error(msgError.message);
            }

            return new Response(JSON.stringify({
                conversation,
                messages: messages || []
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Otherwise, list all conversations with the latest message preview
        const { data: conversations, error: listError } = await supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false });

        if (listError) {
            throw new Error(listError.message);
        }

        // For each conversation, get the latest message as a preview
        const enriched = await Promise.all(
            (conversations || []).map(async (conv) => {
                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('role, content, created_at')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                // Get total message count
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id);

                return {
                    ...conv,
                    last_message: lastMsg || null,
                    message_count: count || 0
                };
            })
        );

        return new Response(JSON.stringify({ conversations: enriched }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Conversations API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }
        const token = authHeader.split(' ')[1];

        // Only Super Admin can manage admins
        const isSuperAdmin = await verifyPassword(token, env);
        if (!isSuperAdmin) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Super Admin only' }), { status: 403, headers: corsHeaders });
        }

        const body = await request.json();
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        if (body.action === 'add_admin') {
            const { username, password } = body;
            if (!username || !password) return new Response('Missing fields', { status: 400 });

            // Hash password
            const msgBuffer = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const { error } = await supabase.from('admins').insert([{
                username,
                password_hash: hashHex
            }]);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        if (body.action === 'delete_admin') {
            const { id } = body;
            const { error } = await supabase.from('admins').delete().eq('id', id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        return new Response('Invalid action', { status: 400 });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}

async function verifyPassword(token, env) {
    const msgBuffer = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const EXPECTED_HASH = 'd1d5f5926de23ba5bbe8203a3b928e4159c3da740077b12dd831642bf4ba2fa4';
    return hashHex === EXPECTED_HASH;
}

