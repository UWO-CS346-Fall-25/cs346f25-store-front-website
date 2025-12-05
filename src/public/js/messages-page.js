document.addEventListener('DOMContentLoaded', function () {
  const list = document.getElementById('messages-list');
  const form = document.getElementById('messages-form');
  const bodyInput = document.getElementById('messages-body');
  // const subjectInput = document.getElementById('messages-subject');

  if (!list || !form) return;

  async function fetchMessages() {
    list.innerHTML =
      '<div class="messages-empty muted">Loading messages…</div>';
    try {
      const r = await fetch('/api/messages', { credentials: 'same-origin' });
      if (!r.ok) {
        list.innerHTML =
          '<div class="messages-empty muted">Unable to load messages.</div>';
        return;
      }
      const j = await r.json();
      const msgs = j.messages || [];
      renderMessages(msgs);
    } catch {
      list.innerHTML =
        '<div class="messages-empty muted">Error loading messages.</div>';
    }
  }

  function renderMessages(msgs) {
    if (!msgs.length) {
      list.innerHTML =
        '<div class="messages-empty muted">No messages yet. Say hi!</div>';
      return;
    }
    list.innerHTML = '';
    msgs.forEach((m) => {
      const el = document.createElement('div');
      el.className =
        'message' + (m.is_from_user ? ' from-user' : ' from-server');
      const header = document.createElement('div');
      header.className = 'message-header';
      const time = document.createElement('time');
      time.dateTime = m.created_at;
      time.textContent = new Date(m.created_at).toLocaleString();
      header.appendChild(time);
      el.appendChild(header);
      const body = document.createElement('div');
      body.className = 'message-body';
      body.textContent = m.body;
      el.appendChild(body);
      list.appendChild(el);
    });
    list.scrollTop = list.scrollHeight;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const body = bodyInput.value && bodyInput.value.trim();
    if (!body) return;
    const tmp = {
      id: 'tmp-' + Date.now(),
      is_from_user: true,
      body,
      created_at: new Date().toISOString(),
    };
    appendTempMessage(tmp);
    bodyInput.value = '';
    try {
      const r = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) {
        console.error('Send failed', await r.text());
      }
      // refresh list
      fetchMessages();
    } catch (err) {
      console.error('Send error', err);
    }
  });

  function appendTempMessage(m) {
    const el = document.createElement('div');
    el.className = 'message from-user';
    const header = document.createElement('div');
    header.className = 'message-header';
    const time = document.createElement('time');
    time.dateTime = m.created_at;
    time.textContent = new Date(m.created_at).toLocaleTimeString();
    header.appendChild(time);
    el.appendChild(header);
    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = m.body;
    el.appendChild(body);
    list.appendChild(el);
    list.scrollTop = list.scrollHeight;
  }

  // Initial load
  fetchMessages();
});
