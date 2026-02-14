import { createClient } from '@supabase/supabase-js';

/**
 * Cloudflare Pages Function: /api/email-webhook
 * 
 * Receives inbound email webhooks from Resend.
 * When a client replies to an AI email, this endpoint:
 * 1. Finds the existing conversation
 * 2. Stores the reply
 * 3. Generates an AI follow-up via Gemini
 * 4. Sends it back to the client
 * 
 * SETUP: Configure Resend Inbound Webhook to POST to https://moslogix.com/api/email-webhook
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `You are MOS Logix's AI sales assistant. MOS Logix is a professional web design and development team.

Your role:
- Continue the conversation naturally based on the full history
- Be professional, friendly, and engaging
- Ask relevant follow-up questions to understand their project better
- Suggest appropriate services when relevant
- Keep responses concise (2-3 short paragraphs max)
- Never fabricate pricing — work within their stated budget
- If the client shows strong buying signals (agrees to proceed, discusses contracts, asks about payment, sets a specific start date), end your response with the exact tag: [ESCALATE]
- Do NOT include [ESCALATE] in casual conversation or early inquiries

Sign off as "MOS Logix Team".`;

function buildConversationHistory(messages, clientName, budget) {
    let history = `Client Name: ${clientName}\nClient Budget: ${budget || 'Not specified'}\n\nConversation History:\n`;
    for (const msg of messages) {
        const label = msg.role === 'client' ? clientName : 'MOS Logix AI';
        history += `\n[${label}]: ${msg.content}\n`;
    }
    return history;
}

async function generateAIResponse(conversationHistory, env) {
    const apiKey = env.GEMINI_API_KEY || 'AIzaSyC8TasdrtmEabXgg9KrI4cghfMrNfpCUJM';

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{
                            text: SYSTEM_PROMPT + '\n\n' + conversationHistory +
                                '\n\nGenerate your next reply to the client. Write ONLY the email body text, no subject line or headers.'
                        }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No AI response generated');
    }

    return data.candidates[0].content.parts[0].text;
}

async function sendEmailReply(to, subject, htmlBody, env) {
    const resendApiKey = env.RESEND_API_KEY || 're_huntHqkk_FzBA21W95denW9hE8athbHhC';

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'MOS Logix <info@moslogix.com>',
            to: to,
            subject: subject,
            html: htmlBody
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Resend Error: ${err}`);
    }
    return await response.json();
}

function textToHtml(text) {
    return text
        .split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

// Handle OPTIONS
export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const payload = await request.json();

        // Resend inbound webhook payload structure:
        // { from: "sender@email.com", to: "...", subject: "...", text: "...", html: "..." }
        const senderEmail = payload.from || payload.sender;
        const messageText = payload.text || payload.html || '';

        // Validation: skip emails from onboarding@resend.dev (the bot itself)
        if (!senderEmail || senderEmail.includes('onboarding@resend.dev')) {
            return new Response(JSON.stringify({ success: true, message: 'Skipped — self-email' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Basic input validation
        if (!messageText.trim()) {
            return new Response(JSON.stringify({ success: false, message: 'Empty message' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // Find existing conversation by client email
        const { data: conversations, error: findError } = await supabase
            .from('conversations')
            .select('*')
            .eq('client_email', senderEmail)
            .in('status', ['active', 'escalated'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (findError || !conversations || conversations.length === 0) {
            console.error('No conversation found for:', senderEmail);
            return new Response(JSON.stringify({ success: false, message: 'No active conversation found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const conversation = conversations[0];

        // If conversation is already escalated, don't send AI reply — human takes over
        if (conversation.status === 'escalated') {
            // Still store the message for the admin to see
            await supabase.from('messages').insert([{
                conversation_id: conversation.id,
                role: 'client',
                content: messageText.trim()
            }]);

            return new Response(JSON.stringify({ success: true, message: 'Stored — awaiting human response (escalated)' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Store client reply
        await supabase.from('messages').insert([{
            conversation_id: conversation.id,
            role: 'client',
            content: messageText.trim()
        }]);

        // Load full conversation history
        const { data: allMessages } = await supabase
            .from('messages')
            .select('role, content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

        // Generate AI response with full context
        const conversationHistory = buildConversationHistory(
            allMessages || [],
            conversation.client_name,
            conversation.budget
        );

        const aiReplyText = await generateAIResponse(conversationHistory, env);

        // Check for escalation
        const shouldEscalate = aiReplyText.includes('[ESCALATE]');
        const cleanReply = aiReplyText.replace(/\[ESCALATE\]/g, '').trim();

        // Store AI reply
        await supabase.from('messages').insert([{
            conversation_id: conversation.id,
            role: 'ai',
            content: cleanReply
        }]);

        // Update status if escalated
        if (shouldEscalate) {
            await supabase
                .from('conversations')
                .update({ status: 'escalated' })
                .eq('id', conversation.id);
        }

        // Send AI reply email
        await sendEmailReply(
            senderEmail,
            `Re: Your Project Inquiry — MOS Logix`,
            `<div style="font-family: 'Inter', Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto;">
                <p>Hi ${conversation.client_name},</p>
                ${textToHtml(cleanReply)}
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
                <p style="color: #94A3B8; font-size: 12px;">This is an automated response from MOS Logix. A team member will follow up shortly.</p>
            </div>`,
            env
        );

        return new Response(JSON.stringify({
            success: true,
            message: shouldEscalate ? 'Reply sent — conversation escalated to human' : 'AI reply sent'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
