const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

const LIST_SQL = `
  SELECT gr.*, COALESCE(s.name, gr.supplier_name) AS supplier_display_name, vp.name AS parcel_name
  FROM grape_receptions gr
  LEFT JOIN suppliers s ON s.id = gr.supplier_id
  LEFT JOIN vineyard_parcels vp ON vp.id = gr.parcel_id
  WHERE gr.tenant_id = ?
  ORDER BY gr.reception_date DESC
`;

router.get('/grape-receptions', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /grape-receptions/:id/receipt -> everything the printable "potvrda o
// prijemu" needs in one call (client renders + prints it, T2.3).
router.get('/grape-receptions/:id/receipt', async (req, res, next) => {
  try {
    const [[reception]] = await pool.query(
      `SELECT gr.*, COALESCE(s.name, gr.supplier_name) AS supplier_display_name,
              s.address AS supplier_address, s.phone AS supplier_phone,
              vp.name AS parcel_name
       FROM grape_receptions gr
       LEFT JOIN suppliers s ON s.id = gr.supplier_id
       LEFT JOIN vineyard_parcels vp ON vp.id = gr.parcel_id
       WHERE gr.id = ? AND gr.tenant_id = ?`,
      [req.params.id, req.user.tenant_id]
    );
    if (!reception) {
      return res.status(404).json({ message: 'Prijem nije pronađen.' });
    }
    const [[tenant]] = await pool.query('SELECT name FROM tenants WHERE id = ?', [req.user.tenant_id]);
    res.json({ reception, tenant });
  } catch (err) {
    next(err);
  }
});

// GET /grape-receptions/:id/traceability -> sledljivost grožđe -> šira/fermentacija
// -> nega -> punjenje (T2.5), sve grane koje ova partija napaja.
router.get('/grape-receptions/:id/traceability', async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const [[reception]] = await pool.query('SELECT * FROM grape_receptions WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      tenantId
    ]);
    if (!reception) {
      return res.status(404).json({ message: 'Prijem nije pronađen.' });
    }

    const [pressings] = await pool.query(
      `SELECT grp.*, mf.name AS fermentation_name, mf.wine_type, mf.status AS fermentation_status
       FROM grape_reception_pressings grp
       JOIN must_fermentations mf ON mf.id = grp.fermentation_id
       WHERE grp.reception_id = ?`,
      [req.params.id]
    );

    const fermentationIds = pressings.map((p) => p.fermentation_id);
    let agings = [];
    let chargings = [];

    if (fermentationIds.length) {
      const placeholders = fermentationIds.map(() => '?').join(',');
      [agings] = await pool.query(
        `SELECT wa.*, v.name AS vessel_name
         FROM wine_agings wa
         LEFT JOIN wine_vessels v ON v.id = wa.vessel_id
         WHERE wa.fermentation_id IN (${placeholders})`,
        fermentationIds
      );

      const agingIds = agings.map((a) => a.id);
      if (agingIds.length) {
        const agingPlaceholders = agingIds.map(() => '?').join(',');
        [chargings] = await pool.query(
          `SELECT * FROM wine_chargings WHERE aging_id IN (${agingPlaceholders}) ORDER BY charging_date DESC`,
          agingIds
        );
      }
    }

    res.json({ reception, pressings, agings, chargings });
  } catch (err) {
    next(err);
  }
});

router.post('/grape-receptions', async (req, res, next) => {
  try {
    const {
      id,
      parcel_id,
      supplier_id,
      announcement_id,
      grape_variety,
      reception_date,
      quantity_kg,
      sugar_degrees,
      notes
    } = req.body;

    if (id) {
      const check = await validator.canEditGrapeReception(
        pool,
        id,
        { parcel_id, grape_variety, quantity_kg },
        req.user.tenant_id
      );
      if (!check.canProceed) {
        return res.status(409).json({ message: check.message, ...check });
      }

      await pool.query(
        `UPDATE grape_receptions
         SET parcel_id = ?, supplier_id = ?, announcement_id = ?, grape_variety = ?, reception_date = ?,
             quantity_kg = ?, sugar_degrees = ?, notes = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          parcel_id || null,
          supplier_id || null,
          announcement_id || null,
          grape_variety,
          reception_date,
          quantity_kg,
          sugar_degrees || null,
          notes,
          id,
          req.user.tenant_id
        ]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      `INSERT INTO grape_receptions
       (id, tenant_id, parcel_id, supplier_id, announcement_id, grape_variety, reception_date, quantity_kg, quantity_kg_current, sugar_degrees, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        req.user.tenant_id,
        parcel_id || null,
        supplier_id || null,
        announcement_id || null,
        grape_variety,
        reception_date,
        quantity_kg,
        quantity_kg,
        sugar_degrees || null,
        notes
      ]
    );

    if (announcement_id) {
      await pool.query("UPDATE harvest_announcements SET status = 'received' WHERE id = ? AND tenant_id = ?", [
        announcement_id,
        req.user.tenant_id
      ]);
    }

    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/grape-receptions/:id', async (req, res, next) => {
  try {
    const check = await validator.canDeleteGrapeReception(pool, req.params.id, req.user.tenant_id);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }
    await pool.query('DELETE FROM grape_receptions WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deletionType: check.deletionType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
