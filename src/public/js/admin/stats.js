document.addEventListener('DOMContentLoaded', function () {
  const ctx = document.getElementById('dbChart').getContext('2d');
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
    const labels = series.map(s => new Date(s.ts).toLocaleString());
    const data = series.map(s => s.count);
    document.getElementById('total-calls').textContent = json.total || 0;
    createChart(labels, data);
  }

  const minutesEl = document.getElementById('minutes');
  const refreshBtn = document.getElementById('refresh');
  const resetBtn = document.getElementById('reset');

  refreshBtn.addEventListener('click', () => load(minutesEl.value));
  minutesEl.addEventListener('change', () => load(minutesEl.value));

  resetBtn.addEventListener('click', async () => {
    if (!confirm('Reset collected DB stats?')) return;
    await fetch('/admin/stats/reset', { method: 'POST' });
    load(minutesEl.value);
  });

  // initial load
  load(minutesEl.value);
});
