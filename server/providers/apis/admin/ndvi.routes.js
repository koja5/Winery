const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const sentinelHub = require('../../services/sentinel-hub.service');

router.get('/vineyard-parcels/:id/ndvi', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT geo_boundary FROM vineyard_parcels WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user.tenant_id]
    );
    if (!rows.length || !rows[0].geo_boundary) {
      return res.status(404).json({ message: 'ndvi.noBoundary' });
    }

    const today = new Date();
    const dateTo = req.query.to || today.toISOString().slice(0, 10);
    const dateFrom =
      req.query.from || new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const image = await sentinelHub.fetchNdviImage(rows[0].geo_boundary, dateFrom, dateTo);
    res.set('Content-Type', 'image/png');
    res.send(image);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
