const PERIOD_EXPRESSIONS = {
  day: (col) => `DATE_FORMAT(${col}, '%Y-%m-%d')`,
  month: (col) => `DATE_FORMAT(${col}, '%Y-%m')`,
  quarter: (col) => `CONCAT(YEAR(${col}), '-Q', QUARTER(${col}))`,
  year: (col) => `CAST(YEAR(${col}) AS CHAR)`
};

module.exports = { PERIOD_EXPRESSIONS };
