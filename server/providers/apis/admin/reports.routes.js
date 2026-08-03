const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const reportEngine = require('../../services/reports/report-engine.service');

router.get('/reports/datasets', (req, res) => {
  res.json(reportEngine.listDatasets());
});

router.post('/reports/run', async (req, res, next) => {
  try {
    const { dataset, ...request } = req.body;
    if (!dataset) {
      return res.status(400).json({ message: 'dataset je obavezan.' });
    }
    const rows = await reportEngine.run(pool, dataset, request, req.user.tenant_id);
    res.json(rows);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
});

router.post('/reports/drilldown', async (req, res, next) => {
  try {
    const { dataset, ...request } = req.body;
    if (!dataset) {
      return res.status(400).json({ message: 'dataset je obavezan.' });
    }
    const rows = await reportEngine.drilldown(pool, dataset, request, req.user.tenant_id);
    res.json(rows);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
});

module.exports = router;
