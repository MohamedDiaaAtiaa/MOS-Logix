import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// System prompt for the AI sales assistant
const SYSTEM_PROMPT = `You are MOS Logix's AI sales assistant. MOS Logix is a professional web design and development team.

Your role:
- Respond to potential client inquiries in a professional, friendly, and engaging manner
- Ask follow-up questions about their project to understand their needs better
- Suggest relevant services (Custom Websites, Web Applications, E-commerce, Redesigns, Maintenance Plans)
- Be warm but professional. Use the client's name naturally.
- Keep responses concise (2-3 short paragraphs max)
- Never make up pricing — refer to their stated budget and say you'll work within it
- If the client shows strong buying signals (agrees to a proposal, mentions wanting to proceed, discusses contracts, asks about payment, sets a specific start date), end your response with the exact tag: [ESCALATE]
- Do NOT include [ESCALATE] in casual conversation or early inquiries — only when a deal is clearly forming

You are representing MOS Logix. Sign off emails as "MOS Logix Team".`;

/**
 * Build conversation history for Gemini context
 */
function buildConversationHistory(messages, clientName, budget) {
    let history = `Client Name: ${clientName}\nClient Budget: ${budget || 'Not specified'}\n\nConversation History:\n`;
    for (const msg of messages) {
        const label = msg.role === 'client' ? clientName : 'MOS Logix AI';
        history += `\n[${label}]: ${msg.content}\n`;
    }
    return history;
}

/**
 * Call Gemini API to generate a response
 */
async function generateAIResponse(conversationHistory, env) {
    const apiKey = env.GEMINI_API_KEY || 'AIzaSyC8TasdrtmEabXgg9KrI4cghfMrNfpCUJM';

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + conversationHistory + '\n\nGenerate your next reply to the client. Write ONLY the email body text, no subject line or headers.' }] }
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
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('No AI response generated');
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Send an email reply via Resend
 */
async function sendEmailReply(to, subject, htmlBody, env) {
    const resendApiKey = env.RESEND_API_KEY || 're_huntHqkk_FzBA21W95denW9hE8athbHhC';

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'onboarding@resend.dev',
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

/**
 * Convert plain text to HTML for email
 */
function textToHtml(text) {
    return text
        .split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

// Handle OPTIONS preflight
export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    return new Response(
        JSON.stringify({ success: false, message: `Method ${request.method} not allowed. Use POST.` }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
}

export async function onRequestPost({ request, env }) {
    try {
        const formData = await request.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const budget = formData.get('budget');
        const message = formData.get('message');
        const subject = formData.get('_subject') || 'New Inquiry';

        // Validate inputs
        if (!name || !email || !message) {
            return new Response(JSON.stringify({ success: false, message: 'Name, email, and message are required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid email address.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // 1. Store in contacts table (existing behavior)
        const { error: contactError } = await supabase
            .from('contacts')
            .insert([{ name, email, budget, message }]);

        if (contactError) {
            console.error('Contacts insert error:', contactError);
        }

        // 2. Send notification email to info@ (existing behavior)
        const resendApiKey = env.RESEND_API_KEY || 're_huntHqkk_FzBA21W95denW9hE8athbHhC';
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: 'info@moslogix.com',
                subject: `${subject}: ${name}`,
                html: `
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Budget:</strong> ${budget}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                `
            })
        });

        // ─── NEW: AI Auto-Response Flow ──────────────────────────────

        // 3. Create conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert([{
                client_name: name,
                client_email: email,
                budget: budget || null,
                status: 'active'
            }])
            .select()
            .single();

        if (convError) {
            console.error('Conversation insert error:', convError);
            // Still return success for the contact form — AI is a bonus
            return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 4. Store client's initial message
        await supabase.from('messages').insert([{
            conversation_id: conversation.id,
            role: 'client',
            content: message
        }]);

        // 5. Generate AI response
        const conversationHistory = buildConversationHistory(
            [{ role: 'client', content: message }],
            name,
            budget
        );

        let aiReplyText;
        try {
            aiReplyText = await generateAIResponse(conversationHistory, env);
        } catch (aiError) {
            console.error('AI generation failed:', aiError);
            // Don't fail the whole request if AI fails
            return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 6. Check for escalation
        const shouldEscalate = aiReplyText.includes('[ESCALATE]');
        const cleanReply = aiReplyText.replace(/\[ESCALATE\]/g, '').trim();

        // 7. Store AI response
        await supabase.from('messages').insert([{
            conversation_id: conversation.id,
            role: 'ai',
            content: cleanReply
        }]);

        // 8. Update conversation status if escalated
        if (shouldEscalate) {
            await supabase
                .from('conversations')
                .update({ status: 'escalated' })
                .eq('id', conversation.id);
        }

        // 9. Send AI reply to client
        try {
            await sendEmailReply(
                email,
                `Re: Your Project Inquiry — MOS Logix`,
                `<div style="font-family: 'Inter', Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto;">
                    <p>Hi ${name},</p>
                    ${textToHtml(cleanReply)}
                    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
                    <p style="color: #94A3B8; font-size: 12px;">This is an automated response from MOS Logix. A team member will follow up shortly.</p>
                </div>`,
                env
            );
        } catch (emailError) {
            console.error('Failed to send AI reply email:', emailError);
        }

        return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Contact submission error:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
