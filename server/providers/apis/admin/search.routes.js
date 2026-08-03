const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

const MIN_QUERY_LENGTH = 2;

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < MIN_QUERY_LENGTH) {
      return res.json({ groups: [] });
    }
    const tenantId = req.user.tenant_id;
    const like = `%${q}%`;

    const [suppliers] = await pool.query(
      'SELECT id, name, contact_person FROM suppliers WHERE tenant_id = ? AND name LIKE ? ORDER BY name ASC LIMIT 5',
      [tenantId, like]
    );

    const [receptions] = await pool.query(
      `SELECT id, supplier_name, grape_variety, reception_date FROM grape_receptions
       WHERE tenant_id = ? AND (supplier_name LIKE ? OR grape_variety LIKE ?) ORDER BY reception_date DESC LIMIT 5`,
      [tenantId, like, like]
    );

    const [vessels] = await pool.query(
      'SELECT id, name, vessel_type FROM wine_vessels WHERE tenant_id = ? AND name LIKE ? ORDER BY name ASC LIMIT 5',
      [tenantId, like]
    );

    const [workOrders] = await pool.query(
      'SELECT id, title, status FROM work_orders WHERE tenant_id = ? AND title LIKE ? ORDER BY due_date DESC LIMIT 5',
      [tenantId, like]
    );

    const groups = [
      {
        type: 'supplier',
        label: 'Dobavljači',
        items: suppliers.map((s) => ({
          id: s.id,
          label: s.name,
          subtitle: s.contact_person || null,
          route: '/podrum/berba/dobavljaci'
        }))
      },
      {
        type: 'reception',
        label: 'Prijem grožđa',
        items: receptions.map((r) => ({
          id: r.id,
          label: r.supplier_name || r.grape_variety || 'Prijem',
          subtitle: r.grape_variety || null,
          route: '/podrum/berba/prijem'
        }))
      },
      {
        type: 'vessel',
        label: 'Posude',
        items: vessels.map((v) => ({
          id: v.id,
          label: v.name,
          subtitle: v.vessel_type,
          route: '/podrum/posude'
        }))
      },
      {
        type: 'work_order',
        label: 'Radni nalozi',
        items: workOrders.map((w) => ({
          id: w.id,
          label: w.title,
          subtitle: w.status,
          route: '/podrum/radni-nalozi'
        }))
      }
    ];

    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
