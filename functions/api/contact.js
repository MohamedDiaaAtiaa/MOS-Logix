document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const statusMsg = document.getElementById('statusMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusMsg.textContent = '';

    try {
      // Collect form data
      const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        budget: form.budget.value.trim(),
        message: form.message.value.trim()
      };

      // Basic validation
      if (!formData.name || !formData.email || !formData.message) {
        statusMsg.textContent = 'Please fill in all required fields.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';
        return;
      }

      // POST request to Cloudflare Pages Function
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Parse JSON response
      const data = await res.json();

      if (res.ok && data.success) {
        statusMsg.textContent = data.message || 'Message sent successfully!';
        form.reset();
      } else {
        statusMsg.textContent = data.message || 'Submission failed. Try again.';
      }

    } catch (err) {
      console.error('Submission Error:', err);
      statusMsg.textContent = 'An error occurred. Try again later.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send';
    }
  });
});
