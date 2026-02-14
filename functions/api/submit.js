/**
 * Cloudflare Pages Function to proxy FormSubmit.co requests from backend.
 * Bypasses client-side CORS/Certificate issues.
 */
export async function onRequestPost({ request }) {
    try {
        const formData = await request.formData();

        // Forward the request to FormSubmit.co AJAX endpoint
        const response = await fetch('https://formsubmit.co/ajax/info@moslogix.com', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
