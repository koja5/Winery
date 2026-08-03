const { PERIOD_EXPRESSIONS } = require('./period-expressions');

async function runSqlDataset(pool, ds, { dimensions, metrics, period, from, to, tenantId }) {
  const dimSelects = dimensions.map((d) => `${ds.dimensions[d].sql} AS \`${d}\``);
  const dimGroupBy = dimensions.map((d) => ds.dimensions[d].sql);

  const periodSelect = period ? [`${PERIOD_EXPRESSIONS[period](ds.dateColumn)} AS \`period\``] : [];
  const periodGroupBy = period ? [PERIOD_EXPRESSIONS[period](ds.dateColumn)] : [];

  const metricSelects = metrics.map((m) => `${ds.metrics[m].sql} AS \`${m}\``);

  const selectClause = [...dimSelects, ...periodSelect, ...metricSelects].join(', ');
  const groupByClause = [...dimGroupBy, ...periodGroupBy];

  let sql = `SELECT ${selectClause} ${ds.from} WHERE ${ds.where}`;
  const values = [tenantId];

  if (ds.dateColumn && from && to) {
    sql += ` AND ${ds.dateColumn} BETWEEN ? AND ?`;
    values.push(from, to);
  }
  if (groupByClause.length) {
    sql += ` GROUP BY ${groupByClause.join(', ')}`;
  }
  if (period) {
    sql += ' ORDER BY `period` ASC';
  }

  const [rows] = await pool.query(sql, values);
  return rows;
}

async function drilldownSqlDataset(pool, ds, { dimensionValues, period, periodValue, from, to, tenantId }) {
  const columns = ds.drilldownColumns || [];
  const selectClause = columns.length ? columns.map((c) => `${c.sql} AS \`${c.key}\``).join(', ') : '*';

  const whereParts = [ds.where];
  const values = [tenantId];

  if (ds.dateColumn && from && to) {
    whereParts.push(`${ds.dateColumn} BETWEEN ? AND ?`);
    values.push(from, to);
  }

  for (const [dimKey, value] of Object.entries(dimensionValues || {})) {
    const dim = ds.dimensions[dimKey];
    if (!dim || value === null || value === undefined || value === '') continue;
    whereParts.push(`${dim.sql} = ?`);
    values.push(value);
  }

  if (period && periodValue && PERIOD_EXPRESSIONS[period]) {
    whereParts.push(`${PERIOD_EXPRESSIONS[period](ds.dateColumn)} = ?`);
    values.push(periodValue);
  }

  const orderBy = ds.dateColumn ? ` ORDER BY ${ds.dateColumn} DESC` : '';
  const sql = `SELECT ${selectClause} ${ds.from} WHERE ${whereParts.join(' AND ')}${orderBy} LIMIT 200`;

  const [rows] = await pool.query(sql, values);
  return rows;
}

module.exports = { runSqlDataset, drilldownSqlDataset };
