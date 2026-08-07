const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const passwordService = require('../../services/auth/password.service');

router.get('/profile', async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      `SELECT id, firstname, lastname, email, phone, avatar, two_factor_enabled, two_factor_method
       FROM users WHERE id = ?`,
      [req.user.sub]
    );
    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const { firstname, lastname, phone } = req.body;
    await pool.query('UPDATE users SET firstname = ?, lastname = ?, phone = ? WHERE id = ?', [
      firstname || null,
      lastname || null,
      phone || null,
      req.user.sub
    ]);
    res.json({ id: req.user.sub });
  } catch (err) {
    next(err);
  }
});

router.post('/profile/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Trenutna i nova lozinka su obavezne.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Nova lozinka mora imati bar 8 karaktera.' });
    }

    const [[user]] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.sub]);
    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    const valid = await passwordService.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Trenutna lozinka nije ispravna.' });
    }

    const passwordHash = await passwordService.hash(newPassword);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.sub]);
    res.json({ changed: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
