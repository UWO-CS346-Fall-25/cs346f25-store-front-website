document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('messages-form');
  const bodyInput = document.getElementById('messages-body');
  const recipientInput = document.getElementById('recipient');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const body = bodyInput.value && bodyInput.value.trim();
    const recipient = recipientInput.value && recipientInput.value.trim();
    if (!recipient) {
      alert('Recipient missing');
      return;
    }
    if (!body) return;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, body }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error('Send failed', txt);
        alert('Send failed');
      } else {
        // On success, reload the thread to show the new admin message
        window.location.reload();
      }
    } catch (err) {
      console.error('Send error', err);
      alert('Send error');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
