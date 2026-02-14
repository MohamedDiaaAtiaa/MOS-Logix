import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Catch-all: handle OPTIONS preflight and reject non-POST methods with JSON
export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    // For any method other than POST, return a proper JSON 405
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

        // 1. Initialize Supabase
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // 2. Insert into Supabase
        const { error: dbError } = await supabase
            .from('contacts')
            .insert([
                { name, email, budget, message }
            ]);

        if (dbError) {
            console.error('Supabase Error:', dbError);
        }

        // 3. Send Email via Resend
        const resendApiKey = env.RESEND_API_KEY || "re_huntHqkk_FzBA21W95denW9hE8athbHhC";

        const emailResponse = await fetch('https://api.resend.com/emails', {
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

        if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            throw new Error(`Resend API Error: ${errorData}`);
        }

        return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Submission Error:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
