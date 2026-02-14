import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

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

// ─── NEW: Receipt Template ──────────────────────────────────
function getReceiptHtml(name) {
    return `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #080C14; color: #F1F5F9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0F1520; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0F1520; padding: 24px; border-bottom: 1px solid #1E293B; text-align: center;">
                <h1 style="color: #14FFEC; font-family: 'Orbitron', monospace; margin: 0; font-size: 24px; letter-spacing: 2px;">MOS LOGIX</h1>
            </div>
            <div style="padding: 32px 24px;">
                <h2 style="margin-top: 0; color: #F1F5F9; font-size: 20px;">Receipt Confirmed</h2>
                <p style="color: #94A3B8; line-height: 1.6;">Hi ${name},</p>
                <p style="color: #94A3B8; line-height: 1.6;">We've received your project inquiry. Thank you for reaching out to MOS Logix.</p>
                <p style="color: #94A3B8; line-height: 1.6;">Our system is reviewing your details now. You will receive a follow-up response shortly discussing the next steps.</p>
                
                <div style="margin: 32px 0; padding: 16px; background: rgba(20, 255, 236, 0.05); border-left: 4px solid #14FFEC; border-radius: 4px;">
                    <p style="margin: 0; color: #14FFEC; font-size: 14px; font-weight: 500;">Status: Processing Inquiry...</p>
                </div>

                <p style="color: #64748B; font-size: 13px; margin-top: 40px;">
                    © 2026 MOS Logix | Engineering the Digital Future
                </p>
            </div>
        </div>
    </div>
    `;
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

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ success: false, message: 'Name, email, and message are required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid email address.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // 1. Store in contacts table
        const { error: contactError } = await supabase
            .from('contacts')
            .insert([{ name, email, budget, message }]);

        if (contactError) console.error('Contacts insert error:', contactError);

        // 2. Send notification to Team (info@)
        // Fire and forget (don't await) to speed up response? No, Cloudflare Workers might kill it. 
        // We'll await but use Promise.all where possible.

        // 3. Send IMMEDIATE Receipt Email to Client
        const receiptPromise = sendEmailReply(
            email,
            `Inquiry Received: ${subject}`,
            getReceiptHtml(name),
            env
        ).catch(e => console.error('Failed to send receipt:', e));

        const adminNotificationPromise = sendEmailReply(
            'info@moslogix.com',
            `${subject}: ${name}`,
            `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Budget:</strong> ${budget}</p><p><strong>Message:</strong></p><p>${message}</p>`,
            env
        ).catch(e => console.error('Failed to send admin notification:', e));

        // We can await these now, or let them run while we generate AI. 
        // Let's await to ensure "Receipt" goes out effectively.
        await Promise.all([receiptPromise, adminNotificationPromise]);

        // ─── AI Auto-Response Flow ──────────────────────────────

        // 4. Create conversation
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
            return new Response(JSON.stringify({ success: true, message: 'Message sent!' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 5. Store client's message
        await supabase.from('messages').insert([{
            conversation_id: conversation.id,
            role: 'client',
            content: message
        }]);

        // 6. Generate AI response
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
            return new Response(JSON.stringify({ success: true, message: 'Message sent!' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const shouldEscalate = aiReplyText.includes('[ESCALATE]');
        const cleanReply = aiReplyText.replace(/\[ESCALATE\]/g, '').trim();

        // 7. Store AI response
        await supabase.from('messages').insert([{
            conversation_id: conversation.id,
            role: 'ai',
            content: cleanReply
        }]);

        if (shouldEscalate) {
            await supabase
                .from('conversations')
                .update({ status: 'escalated' })
                .eq('id', conversation.id);
        }

        // 8. Send AI Reply (Follow-up)
        // We add a slight delay/differentiation? No, just send it.
        // It's the "Detailed" response.
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
