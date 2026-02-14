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
        // 1. Auth Check (Custom Admin Credential)
        const authHeader = request.headers.get('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;

        if (!token) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Missing credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Verify password hash (SHA-256 of 'QwErAsDZx@2026')
        // We use Web Crypto API which is available in Cloudflare Workers
        const msgBuffer = new TextEncoder().encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Expected hash for 'QwErAsDZx@2026'
        const EXPECTED_HASH = 'd1d5f5926de23ba5bbe8203a3b928e4159c3da740077b12dd831642bf4ba2fa4';

        if (hashHex !== EXPECTED_HASH) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid credentials' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const url = new URL(request.url);
        const conversationId = url.searchParams.get('id');

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

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
