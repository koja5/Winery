const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'evinarija-api', time: new Date().toISOString() });
});

module.exports = router;
