/**
 * Cloudflare Pages Function: /api/contact
 * Handles contact form submissions and relays them to Lark Mail via SMTP.
 * 
 * Securely uses Cloudflare Sockets (connect()) to communicate with Lark SMTP servers.
 */

import { connect } from 'cloudflare:sockets';

export async function onRequest(context) {
    const { request, env } = context;

    // 1. Method Security: Allow GET for health checks, POST for submissions
    if (request.method === 'GET') {
        return new Response(JSON.stringify({ success: true, message: 'Contact API is active and waiting for POST' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 1b. Same-Origin Security Check
    const origin = request.headers.get('origin');
    const url = new URL(request.url);
    // Allow same-host even if protocol differs slightly (http vs https during proxying)
    if (origin && new URL(origin).hostname !== url.hostname) {
        return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 2. Body Parsing & Validation
        const body = await request.json();
        const { name, email, budget, projectType, message, bot_ref } = body;

        // Honeypot check
        if (bot_ref) {
            return new Response(JSON.stringify({ success: true, note: 'Spam detected' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Basic presence check
        if (!name || !email || !projectType || !message) {
            return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Email validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid email format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Sanitization
        const cleanName = name.trim().slice(0, 100);
        const cleanEmail = email.trim();
        const cleanMessage = message.trim().slice(0, 2000);
        const cleanSubject = `New Contact Form Submission - ${projectType}`;
        const timestamp = new Date().toISOString();
        const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown';

        // 4. Rate Limiting (Heuristic using IP as key if needed, or rely on CF WAF)
        // Note: For production, consider using Cloudflare KV or Durable Objects for strict rate limiting.

        // 5. Connect to Lark SMTP via TCP Socket
        // Ensure environment variables are set in Cloudflare Dashboard
        const host = env.LARK_SMTP_HOST || 'smtpli.larksuite.com';
        const port = parseInt(env.LARK_SMTP_PORT || '465');
        const user = env.LARK_SMTP_USER;
        const pass = env.LARK_SMTP_PASS;

        if (!user || !pass) {
            console.error('SMTP Credentials missing in Environment Variables');
            throw new Error('Server configuration error');
        }

        const socket = connect({ hostname: host, port }, { secureTransport: 'tls' });
        const reader = socket.readable.getReader();
        const writer = socket.writable.getWriter();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Helper to read SMTP response
        async function readResponse() {
            const { value, done } = await reader.read();
            if (done) throw new Error('Socket closed unexpectedly');
            const resp = decoder.decode(value);
            // console.log('SMTP:', resp.trim());
            return resp;
        }

        // Helper to send SMTP command
        async function sendCommand(cmd) {
            await writer.write(encoder.encode(cmd + '\r\n'));
        }

        // Read initial greeting
        let response = await readResponse();
        if (!response.startsWith('220')) throw new Error('SMTP Greeting failed');

        // EHLO
        await sendCommand(`EHLO ${request.headers.get('host') || 'moslogix.com'}`);
        response = await readResponse();
        if (!response.includes('250')) throw new Error('EHLO failed');

        // AUTH LOGIN
        await sendCommand('AUTH LOGIN');
        await readResponse();
        await sendCommand(btoa(user));
        await readResponse();
        await sendCommand(btoa(pass));
        response = await readResponse();
        if (!response.includes('235')) throw new Error('AUTH failed');

        // MAIL FROM
        await sendCommand(`MAIL FROM:<${user}>`);
        await readResponse();

        // RCPT TO
        await sendCommand(`RCPT TO:<${user}>`);
        await readResponse();

        // DATA
        await sendCommand('DATA');
        await readResponse();

        // Build Email Content (MIME)
        const mimeMessage = [
            `Subject: ${cleanSubject}`,
            `From: "MOS Logix Form" <${user}>`,
            `To: ${user}`,
            `Reply-To: ${cleanEmail}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=utf-8`,
            '',
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<style>',
            'body { font-family: sans-serif; line-height: 1.6; color: #333; }',
            '.container { padding: 20px; border: 1px solid #eee; border-radius: 10px; }',
            '.header { font-size: 18px; font-weight: bold; border-bottom: 2px solid #14FFEC; padding-bottom: 10px; margin-bottom: 20px; }',
            '.field { margin-bottom: 10px; }',
            '.label { font-weight: bold; color: #1e293b; width: 120px; display: inline-block; }',
            '.message-box { background: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 10px; white-space: pre-wrap; }',
            '.footer { font-size: 12px; color: #64748b; margin-top: 30px; }',
            '</style>',
            '</head>',
            '<body>',
            '<div class="container">',
            `  <div class="header">New Inquiry: ${projectType}</div>`,
            '  <div class="field"><span class="label">Name:</span> ' + cleanName + '</div>',
            '  <div class="field"><span class="label">Email:</span> ' + cleanEmail + '</div>',
            '  <div class="field"><span class="label">Budget:</span> ' + (budget || 'Not specified') + '</div>',
            '  <div class="field"><span class="label">Type:</span> ' + projectType + '</div>',
            '  <div class="field"><span class="label">Time:</span> ' + timestamp + '</div>',
            '  <div class="field"><span class="label">IP:</span> ' + clientIp + '</div>',
            '  <div class="field" style="margin-top:20px;"><span class="label">Message:</span></div>',
            '  <div class="message-box">' + cleanMessage + '</div>',
            '  <div class="footer">This email was sent via the Cloudflare Pages contact relay.</div>',
            '</div>',
            '</body>',
            '</html>',
            '.'
        ].join('\r\n');

        await writer.write(encoder.encode(mimeMessage + '\r\n'));
        response = await readResponse();
        if (!response.includes('250')) throw new Error('DATA send failed');

        // QUIT
        await sendCommand('QUIT');

        // Clean up
        writer.releaseLock();
        reader.releaseLock();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Contact API Error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
