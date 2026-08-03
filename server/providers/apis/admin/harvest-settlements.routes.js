const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

const LIST_SQL = `
  SELECT hs.*, s.name AS supplier_name,
         COALESCE(p.paid_amount, 0) AS paid_amount,
         (hs.total_amount - COALESCE(p.paid_amount, 0)) AS balance_due
  FROM harvest_settlements hs
  LEFT JOIN suppliers s ON s.id = hs.supplier_id
  LEFT JOIN (
    SELECT settlement_id, SUM(amount) AS paid_amount
    FROM harvest_settlement_payments GROUP BY settlement_id
  ) p ON p.settlement_id = hs.id
  WHERE hs.tenant_id = ?
  ORDER BY hs.settlement_date DESC
`;

router.get('/harvest-settlements', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /harvest-settlements/unsettled-receptions?supplier_id=... -> receptions
// of this supplier not yet attached to any settlement, for the "new settlement" picker.
router.get('/harvest-settlements/unsettled-receptions', async (req, res, next) => {
  try {
    const { supplier_id } = req.query;
    if (!supplier_id) {
      return res.status(400).json({ message: 'supplier_id je obavezan.' });
    }
    const [rows] = await pool.query(
      `SELECT gr.id, gr.reception_date, gr.grape_variety, gr.quantity_kg
       FROM grape_receptions gr
       LEFT JOIN harvest_settlement_receptions hsr ON hsr.reception_id = gr.id
       WHERE gr.tenant_id = ? AND gr.supplier_id = ? AND hsr.id IS NULL
       ORDER BY gr.reception_date ASC`,
      [req.user.tenant_id, supplier_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/harvest-settlements/:id', async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const [[settlement]] = await pool.query(
      `SELECT hs.*, s.name AS supplier_name FROM harvest_settlements hs
       LEFT JOIN suppliers s ON s.id = hs.supplier_id
       WHERE hs.id = ? AND hs.tenant_id = ?`,
      [req.params.id, tenantId]
    );
    if (!settlement) {
      return res.status(404).json({ message: 'Obračun nije pronađen.' });
    }
    const [receptions] = await pool.query(
      `SELECT hsr.quantity_kg, gr.id, gr.reception_date, gr.grape_variety
       FROM harvest_settlement_receptions hsr
       JOIN grape_receptions gr ON gr.id = hsr.reception_id
       WHERE hsr.settlement_id = ?`,
      [req.params.id]
    );
    const [payments] = await pool.query(
      'SELECT * FROM harvest_settlement_payments WHERE settlement_id = ? ORDER BY payment_date DESC',
      [req.params.id]
    );
    res.json({ settlement, receptions, payments });
  } catch (err) {
    next(err);
  }
});

router.post('/harvest-settlements', async (req, res, next) => {
  try {
    const { supplier_id, settlement_date, price_per_kg, reception_ids, notes } = req.body;
    if (!supplier_id || !price_per_kg || !Array.isArray(reception_ids) || reception_ids.length === 0) {
      return res.status(400).json({ message: 'supplier_id, price_per_kg i reception_ids su obavezni.' });
    }

    const tenantId = req.user.tenant_id;
    const placeholders = reception_ids.map(() => '?').join(',');
    const [receptions] = await pool.query(
      `SELECT id, quantity_kg FROM grape_receptions WHERE tenant_id = ? AND supplier_id = ? AND id IN (${placeholders})`,
      [tenantId, supplier_id, ...reception_ids]
    );
    if (receptions.length !== reception_ids.length) {
      return res.status(400).json({ message: 'Neke od izabranih partija ne pripadaju ovom dobavljaču.' });
    }

    const totalQuantityKg = receptions.reduce((sum, r) => sum + Number(r.quantity_kg), 0);
    const totalAmount = Math.round(totalQuantityKg * price_per_kg * 100) / 100;
    const settlementId = randomUUID();

    await pool.query(
      `INSERT INTO harvest_settlements
       (id, tenant_id, supplier_id, settlement_date, price_per_kg, total_quantity_kg, total_amount, status, notes)
       VALUES (?,?,?,?,?,?,?,'unpaid',?)`,
      [settlementId, tenantId, supplier_id, settlement_date, price_per_kg, totalQuantityKg, totalAmount, notes]
    );

    for (const reception of receptions) {
      await pool.query(
        'INSERT INTO harvest_settlement_receptions (id, settlement_id, reception_id, quantity_kg) VALUES (?,?,?,?)',
        [randomUUID(), settlementId, reception.id, reception.quantity_kg]
      );
    }

    res.json({ id: settlementId });
  } catch (err) {
    next(err);
  }
});

router.post('/harvest-settlements/:id/payments', async (req, res, next) => {
  try {
    const { payment_date, amount, method, notes } = req.body;
    const tenantId = req.user.tenant_id;

    const [[settlement]] = await pool.query('SELECT * FROM harvest_settlements WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      tenantId
    ]);
    if (!settlement) {
      return res.status(404).json({ message: 'Obračun nije pronađen.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Iznos uplate mora biti pozitivan broj.' });
    }

    await pool.query(
      'INSERT INTO harvest_settlement_payments (id, tenant_id, settlement_id, payment_date, amount, method, notes) VALUES (?,?,?,?,?,?,?)',
      [randomUUID(), tenantId, req.params.id, payment_date, amount, method || null, notes || null]
    );

    await recomputeSettlementStatus(req.params.id, settlement.total_amount);

    res.json({ created: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/harvest-settlements/:id', async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const [[settlement]] = await pool.query('SELECT id FROM harvest_settlements WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      tenantId
    ]);
    if (!settlement) {
      return res.status(404).json({ message: 'Obračun nije pronađen.' });
    }
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM harvest_settlement_payments WHERE settlement_id = ?',
      [req.params.id]
    );
    if (count > 0) {
      return res.status(409).json({
        message: 'productionChain.hasTransferHistory',
        canProceed: false,
        deletionType: 'none',
        affectedEntities: { payments: count }
      });
    }
    await pool.query('DELETE FROM harvest_settlements WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);
    res.json({ deletionType: 'both' });
  } catch (err) {
    next(err);
  }
});

async function recomputeSettlementStatus(settlementId, totalAmount) {
  const [[{ paid }]] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as paid FROM harvest_settlement_payments WHERE settlement_id = ?',
    [settlementId]
  );
  let status = 'unpaid';
  if (paid >= totalAmount) status = 'paid';
  else if (paid > 0) status = 'partially_paid';
  await pool.query('UPDATE harvest_settlements SET status = ? WHERE id = ?', [status, settlementId]);
}

module.exports = router;
