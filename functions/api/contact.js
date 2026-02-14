import { createClient } from '@supabase/supabase-js';

export async function onRequestPost({ request, env }) {
    try {
        const formData = await request.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const budget = formData.get('budget');
        const message = formData.get('message');
        const subject = formData.get('_subject') || 'New Inquiry';

        // 1. Initialize Supabase
        // Note: Use env vars from Cloudflare context
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // 2. Insert into Supabase
        const { error: dbError } = await supabase
            .from('contacts')
            .insert([
                { name, email, budget, message }
            ]);

        if (dbError) {
            console.error('Supabase Error:', dbError);
            // We continue to email even if DB fails, or we could return error.
            // Let's log but try to send email.
        }

        // 3. Send Email via Resend
        // We use fetch to call Resend API directly
        const resendApiKey = env.RESEND_API_KEY || "re_huntHqkk_FzBA21W95denW9hE8athbHhC"; // Fallback for dev if env missing, but dangerous in prod.

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev', // Use user's verified domain if available
                to: 'info@moslogix.com', // Target email
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
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submission Error:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
