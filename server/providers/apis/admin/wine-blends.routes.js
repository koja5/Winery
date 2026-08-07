const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

const LIST_SQL = `
  SELECT b.*, ra.wine_variety, ra.vintage_year, ra.lot, v.name AS target_vessel_name
  FROM wine_blends b
  JOIN wine_agings ra ON ra.id = b.result_aging_id
  JOIN wine_vessels v ON v.id = ra.vessel_id
  WHERE b.tenant_id = ?
  ORDER BY b.blend_date DESC
`;

router.get('/wine-blends', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /wine-blends/:id -> blend header + result aging + source components
// (svaka komponenta sa nazivom/posudom izvorne nege), za "expand" prikaz sledljivosti.
router.get('/wine-blends/:id', async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const [[blend]] = await pool.query(
      `SELECT b.*, ra.wine_variety, ra.vintage_year, ra.lot, ra.vessel_id AS target_vessel_id, v.name AS target_vessel_name
       FROM wine_blends b
       JOIN wine_agings ra ON ra.id = b.result_aging_id
       JOIN wine_vessels v ON v.id = ra.vessel_id
       WHERE b.id = ? AND b.tenant_id = ?`,
      [req.params.id, tenantId]
    );
    if (!blend) {
      return res.status(404).json({ message: 'Kupaža nije pronađena.' });
    }

    const [components] = await pool.query(
      `SELECT c.*, sa.wine_variety AS source_wine_variety, sa.vintage_year AS source_vintage_year,
              sa.lot AS source_lot, sv.name AS source_vessel_name
       FROM wine_blend_components c
       JOIN wine_agings sa ON sa.id = c.source_aging_id
       JOIN wine_vessels sv ON sv.id = sa.vessel_id
       WHERE c.blend_id = ?
       ORDER BY c.quantity_liters DESC`,
      [blend.id]
    );

    res.json({ blend, components });
  } catch (err) {
    next(err);
  }
});

// POST /wine-blends -> meša N izvornih nega u jednu novu partiju u ciljnoj posudi.
// body: { name, blend_date, target_vessel_id, wine_variety, vintage_year, notes,
//         components: [{ source_aging_id, quantity_liters }] }
router.post('/wine-blends', async (req, res, next) => {
  const { name, blend_date, target_vessel_id, wine_variety, vintage_year, notes, components } = req.body;
  const tenantId = req.user.tenant_id;

  if (!target_vessel_id) {
    return res.status(400).json({ message: 'Ciljna posuda je obavezna.' });
  }
  if (!blend_date) {
    return res.status(400).json({ message: 'Datum kupažiranja je obavezan.' });
  }
  if (!Array.isArray(components) || components.length < 2) {
    return res.status(400).json({ message: 'Kupaža zahteva bar dve izvorne partije.' });
  }
  for (const c of components) {
    if (!c.source_aging_id || !c.quantity_liters || Number(c.quantity_liters) <= 0) {
      return res.status(400).json({ message: 'Svaka komponenta mora imati izvornu partiju i količinu veću od 0.' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const sources = [];
    for (const c of components) {
      const [[source]] = await conn.query(
        'SELECT * FROM wine_agings WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [c.source_aging_id, tenantId]
      );
      if (!source) {
        throw Object.assign(new Error('Izvorna partija nije pronađena.'), { status: 404 });
      }
      if (Number(source.quantity_liters_current) < Number(c.quantity_liters)) {
        throw Object.assign(
          new Error(
            `Nema dovoljno količine u partiji ${source.lot || source.wine_variety || source.id} (dostupno ${source.quantity_liters_current}L, traženo ${c.quantity_liters}L).`
          ),
          { status: 409 }
        );
      }
      sources.push({ ...source, requested: Number(c.quantity_liters) });
    }

    const totalQuantity = sources.reduce((sum, s) => sum + s.requested, 0);

    const resultAgingId = randomUUID();
    await conn.query(
      `INSERT INTO wine_agings
       (id, tenant_id, vessel_id, fermentation_id, name, wine_variety, vintage_year, lot, start_date, quantity_liters, quantity_liters_current, notes)
       VALUES (?,?,?,NULL,?,?,?,NULL,?,?,?,?)`,
      [
        resultAgingId,
        tenantId,
        target_vessel_id,
        name || null,
        wine_variety || null,
        vintage_year || null,
        blend_date,
        totalQuantity,
        totalQuantity,
        notes || null
      ]
    );

    const blendId = randomUUID();
    await conn.query(
      `INSERT INTO wine_blends (id, tenant_id, result_aging_id, name, blend_date, total_quantity_liters, notes)
       VALUES (?,?,?,?,?,?,?)`,
      [blendId, tenantId, resultAgingId, name || null, blend_date, totalQuantity, notes || null]
    );

    for (const s of sources) {
      await conn.query('UPDATE wine_agings SET quantity_liters_current = quantity_liters_current - ? WHERE id = ?', [
        s.requested,
        s.id
      ]);
      await conn.query(
        `INSERT INTO wine_blend_components (id, blend_id, source_aging_id, quantity_liters, percentage)
         VALUES (?,?,?,?,?)`,
        [randomUUID(), blendId, s.id, s.requested, Math.round((s.requested / totalQuantity) * 10000) / 100]
      );
    }

    await conn.commit();
    res.json({ id: blendId, resultAgingId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE /wine-blends/:id -> vraća potrošenu količinu izvornim partijama i briše
// kupažu + rezultujuću negu (dozvoljeno samo ako rezultat nije dalje potrošen).
router.delete('/wine-blends/:id', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  try {
    const check = await validator.canDeleteWineBlend(pool, req.params.id, tenantId);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[blend]] = await conn.query('SELECT * FROM wine_blends WHERE id = ? AND tenant_id = ?', [
        req.params.id,
        tenantId
      ]);

      const [components] = await conn.query('SELECT * FROM wine_blend_components WHERE blend_id = ?', [blend.id]);
      for (const c of components) {
        await conn.query('UPDATE wine_agings SET quantity_liters_current = quantity_liters_current + ? WHERE id = ?', [
          c.quantity_liters,
          c.source_aging_id
        ]);
      }

      await conn.query('DELETE FROM wine_blends WHERE id = ?', [blend.id]);
      await conn.query('DELETE FROM wine_agings WHERE id = ?', [blend.result_aging_id]);

      await conn.commit();
      res.json({ deletionType: check.deletionType });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
