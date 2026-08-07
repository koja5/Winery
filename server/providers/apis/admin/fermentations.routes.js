const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

// `name` is synthesized when the user didn't set one, so this endpoint doubles
// as both the grid's own list and a combobox source (wine-agings.json ->
// fermentation_id) that expects a plain `name` field on every row.
const LIST_SQL = `
  SELECT mf.id, mf.tenant_id, mf.vessel_id, mf.wine_type, mf.start_date, mf.end_date,
         mf.quantity_liters, mf.quantity_liters_current, mf.status, mf.notes,
         mf.created_at, mf.updated_at,
         COALESCE(mf.name, CONCAT('Fermentacija – ', DATE_FORMAT(mf.start_date, '%d.%m.%Y'))) AS name,
         v.name AS vessel_name,
         grp.reception_id, grp.quantity_kg,
         gr.grape_variety AS reception_grape_variety,
         COALESCE(s.name, gr.supplier_name) AS reception_supplier_name
  FROM must_fermentations mf
  JOIN wine_vessels v ON v.id = mf.vessel_id
  LEFT JOIN grape_reception_pressings grp ON grp.fermentation_id = mf.id
  LEFT JOIN grape_receptions gr ON gr.id = grp.reception_id
  LEFT JOIN suppliers s ON s.id = gr.supplier_id
  WHERE mf.tenant_id = ?
  ORDER BY mf.start_date DESC
`;

router.get('/must-fermentations', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /must-fermentations -> presuje partiju grožđa u posudu i pokreće
// fermentaciju. body: { id?, vessel_id, reception_id, quantity_kg, name,
// wine_type, start_date, end_date, quantity_liters, status, notes }
// `reception_id`/`quantity_kg` (grape_reception_pressings) su create-only —
// forma ih disabledOnEdit, quantity_liters je nominalna količina (isti
// obrazac kao grape_receptions.quantity_kg — edit ne dira _current).
router.post('/must-fermentations', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  const { id, vessel_id, reception_id, quantity_kg, name, wine_type, start_date, end_date, quantity_liters, status, notes } =
    req.body;

  try {
    if (id) {
      const check = await validator.canEditMustFermentation(pool, id, { vessel_id, wine_type, quantity_liters }, tenantId);
      if (!check.canProceed) {
        return res.status(409).json({ message: check.message, ...check });
      }

      await pool.query(
        `UPDATE must_fermentations
         SET vessel_id = ?, name = ?, wine_type = ?, start_date = ?, end_date = ?, quantity_liters = ?, status = ?, notes = ?
         WHERE id = ? AND tenant_id = ?`,
        [vessel_id, name || null, wine_type, start_date, end_date || null, quantity_liters, status || 'in_progress', notes || null, id, tenantId]
      );
      return res.json({ id });
    }

    if (!vessel_id || !reception_id || !quantity_kg || !wine_type || !start_date || !quantity_liters) {
      return res.status(400).json({ message: 'Posuda, partija grožđa, količina i tip vina su obavezni.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[reception]] = await conn.query('SELECT * FROM grape_receptions WHERE id = ? AND tenant_id = ? FOR UPDATE', [
        reception_id,
        tenantId
      ]);
      if (!reception) {
        throw Object.assign(new Error('Partija grožđa nije pronađena.'), { status: 404 });
      }
      if (Number(reception.quantity_kg_current) < Number(quantity_kg)) {
        throw Object.assign(
          new Error(
            `Nema dovoljno grožđa u partiji (dostupno ${reception.quantity_kg_current}kg, traženo ${quantity_kg}kg).`
          ),
          { status: 409 }
        );
      }

      const newId = randomUUID();
      await conn.query(
        `INSERT INTO must_fermentations
         (id, tenant_id, vessel_id, name, wine_type, start_date, end_date, quantity_liters, quantity_liters_current, status, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newId,
          tenantId,
          vessel_id,
          name || null,
          wine_type,
          start_date,
          end_date || null,
          quantity_liters,
          quantity_liters,
          status || 'in_progress',
          notes || null
        ]
      );
      await conn.query(
        'INSERT INTO grape_reception_pressings (id, fermentation_id, reception_id, quantity_kg) VALUES (?,?,?,?)',
        [randomUUID(), newId, reception_id, quantity_kg]
      );
      await conn.query('UPDATE grape_receptions SET quantity_kg_current = quantity_kg_current - ? WHERE id = ?', [
        quantity_kg,
        reception_id
      ]);

      await conn.commit();
      res.json({ id: newId });
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

// DELETE /must-fermentations/:id -> vraća grožđe partiji iz koje je presovano
// i kaskadno briše sve nege/punjenja/pretoke nastale iz ove fermentacije.
router.delete('/must-fermentations/:id', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  try {
    const check = await validator.canDeleteMustFermentation(pool, req.params.id, tenantId);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [pressings] = await conn.query('SELECT * FROM grape_reception_pressings WHERE fermentation_id = ?', [
        req.params.id
      ]);
      for (const p of pressings) {
        await conn.query('UPDATE grape_receptions SET quantity_kg_current = quantity_kg_current + ? WHERE id = ?', [
          p.quantity_kg,
          p.reception_id
        ]);
      }

      const [agings] = await conn.query('SELECT id FROM wine_agings WHERE fermentation_id = ?', [req.params.id]);
      for (const aging of agings) {
        await conn.query('DELETE FROM wine_chargings WHERE aging_id = ?', [aging.id]);
        await conn.query('DELETE FROM vessel_transfers WHERE aging_id = ?', [aging.id]);
        await conn.query('DELETE FROM wine_agings WHERE id = ?', [aging.id]);
      }

      await conn.query('DELETE FROM must_fermentations WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);

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
