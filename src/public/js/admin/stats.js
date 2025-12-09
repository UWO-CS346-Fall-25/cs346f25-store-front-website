document.addEventListener('DOMContentLoaded', function () {
  const ctxEl = document.getElementById('dbChart');
  if (!ctxEl) return;
  const ctx = ctxEl.getContext('2d');
  let chart = null;

  function createChart(labels, data) {
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'DB calls',
          data: data,
          borderColor: 'rgba(33,150,243,1)',
          backgroundColor: 'rgba(33,150,243,0.1)',
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: true },
          y: { display: true, beginAtZero: true }
        }
      }
    });
  }

  async function load(minutes) {
    const res = await fetch('/admin/stats/data?minutes=' + encodeURIComponent(minutes));
    const json = await res.json();
    const series = json.series || [];
    const minutesWindow = Number(minutes) || 60;
    const labels = series.map(s => {
      const d = new Date(s.ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const data = series.map(s => s.count);
    const totalEl = document.getElementById('total-calls');
    if (totalEl) totalEl.textContent = json.total || 0;
    createChart(labels, data);
  }

  const minutesEl = document.getElementById('minutes');
  const refreshBtn = document.getElementById('refresh');
  const resetBtn = document.getElementById('reset');

  refreshBtn && refreshBtn.addEventListener('click', () => load(minutesEl.value));
  minutesEl && minutesEl.addEventListener('change', () => load(minutesEl.value));

  resetBtn && resetBtn.addEventListener('click', async () => {
    if (!confirm('Reset collected DB stats?')) return;
    const meta = document.querySelector('meta[name="csrf-token"]');
    const token = meta ? meta.getAttribute('content') : '';
    await fetch('/admin/stats/reset', { method: 'POST', credentials: 'same-origin', headers: { 'x-csrf-token': token } });
    load(minutesEl.value);
  });

  // Ensure Chart.js is available, otherwise dynamically load it.
  function ensureChartJs() {
    return new Promise((resolve, reject) => {
      if (window.Chart) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Chart.js'));
      document.head.appendChild(script);
    });
  }

  ensureChartJs().then(() => load(minutesEl.value)).catch((err) => {
    console.error('Could not load Chart.js', err);
  });
});
