/**
 * Cloudflare Pages Function to proxy FormSubmit.co requests from backend.
 * Bypasses client-side CORS/Certificate issues.
 */
export async function onRequest(context) {
    const { request } = context;

    // CORS Headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders,
        });
    }

    // Only allow POST
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed" }), {
            status: 405,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    }

    try {
        const formData = await request.formData();

        // Forward the request to FormSubmit.co AJAX endpoint
        const response = await fetch('https://formsubmit.co/ajax/info@moslogix.com', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    }
}
