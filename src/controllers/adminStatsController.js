const dbStats = require('./dbStats');

function statsPage(req, res) {
  res.render('admin/stats', {
    title: 'Admin - DB Stats'
  });
}

function statsData(req, res) {
  const minutes = parseInt(req.query.minutes, 10) || 60;
  const series = dbStats.getSeries(minutes);
  res.json({ series, total: dbStats.getTotal() });
}

function resetStats(req, res) {
  dbStats.reset();
  res.json({ ok: true });
}

module.exports = {
  statsPage,
  statsData,
  resetStats,
};
