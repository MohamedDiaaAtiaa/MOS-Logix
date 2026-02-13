/**
 * Cloudflare Pages Function: /api/contact
 * Handles contact form submissions and relays them to Lark via its Open API.
 */

export async function onRequest(context) {
    const { request, env } = context;

    // 1. Method Security
    if (request.method === 'GET') {
        return new Response(JSON.stringify({ success: true, message: 'Contact API is active' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 2. Body Parsing & Validation
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid JSON payload' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { name, email, budget, projectType, message, bot_ref } = body;

        // Honeypot check
        if (bot_ref) {
            return new Response(JSON.stringify({ success: true, note: 'Spam filtered' }), {
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

        // 3. Auth with Lark: Get tenant_access_token
        const appId = env.LARK_APP_ID;
        const appSecret = env.LARK_APP_SECRET;

        if (!appId || !appSecret) {
            return new Response(JSON.stringify({ success: false, error: 'Server configuration error: Missing Lark Credentials' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const authResponse = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "app_id": appId, "app_secret": appSecret })
        });

        const authData = await authResponse.json();
        if (!authData.tenant_access_token) {
            throw new Error(`Failed to get Lark access token: ${authData.msg || 'Unknown error'}`);
        }

        const accessToken = authData.tenant_access_token;

        // 4. Send Interactive Card to info@moslogix.com
        const timestamp = new Date().toLocaleString();
        const sendResponse = await fetch('https://open.larksuite.com/open-apis/im/v1/messages?receive_id_type=email', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                "receive_id": "info@moslogix.com",
                "msg_type": "interactive",
                "content": JSON.stringify({
                    "config": { "wide_screen_mode": true },
                    "header": {
                        "title": { "tag": "plain_text", "content": `🚀 New Project Inquiry` },
                        "template": "turquoise"
                    },
                    "elements": [
                        {
                            "tag": "div", "fields": [
                                { "is_short": true, "text": { "tag": "lark_md", "content": `**👤 Name:**\n${name}` } },
                                { "is_short": true, "text": { "tag": "lark_md", "content": `**📧 Email:**\n${email}` } },
                                { "is_short": true, "text": { "tag": "lark_md", "content": `**💰 Budget:**\n${budget || 'Not specified'}` } },
                                { "is_short": true, "text": { "tag": "lark_md", "content": `**🏷️ Type:**\n${projectType}` } }
                            ]
                        },
                        { "tag": "hr" },
                        { "tag": "div", "text": { "tag": "lark_md", "content": `**📝 Message:**\n${message}` } },
                        { "tag": "note", "elements": [{ "tag": "plain_text", "content": `Submitted on ${timestamp} from Website Contact Form` }] }
                    ]
                })
            })
        });

        const sendData = await sendResponse.json();
        if (sendData.code !== 0) {
            throw new Error(`Lark API error: ${sendData.msg || 'Failed to send message'}`);
        }

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
