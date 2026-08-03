const express = require('express');
const jwt = require('jsonwebtoken');
const { randomUUID, randomBytes } = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/sql-database').connect();
const authenticateToken = require('../helpers/authenticate-token');
const passwordService = require('../services/auth/password.service');
const twoFactorService = require('../services/auth/two-factor.service');
const demoClonerService = require('../services/demo-cloner.service');
const mailService = require('../services/mail.service');

function issueToken(user) {
  return jwt.sign({ sub: user.id, tenant_id: user.tenant_id, role: user.role_code }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function issueChallengeToken(userId) {
  return jwt.sign({ sub: userId, purpose: '2fa_challenge' }, process.env.JWT_SECRET, { expiresIn: '5m' });
}

// ---------------------------------------------------------------------------
// POST /auth/register -> creates tenant + owner user, optionally clones demo
// data, returns a full JWT (no email verification step in Phase 0 MVP).
// ---------------------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    const { tenantName, firstname, lastname, email, password, cloneDemo = true } = req.body;
    if (!tenantName || !email || !password) {
      return res.status(400).json({ message: 'tenantName, email i password su obavezni.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email je već registrovan.' });
    }

    const [[ownerRole]] = await pool.query("SELECT id FROM roles WHERE code = 'owner'");

    const tenantId = randomUUID();
    const userId = randomUUID();
    const passwordHash = await passwordService.hash(password);

    await pool.query('INSERT INTO tenants (id, name) VALUES (?, ?)', [tenantId, tenantName]);
    await pool.query(
      `INSERT INTO users (id, tenant_id, role_id, firstname, lastname, email, password_hash, verified, active)
       VALUES (?,?,?,?,?,?,?,1,1)`,
      [userId, tenantId, ownerRole.id, firstname || null, lastname || null, email, passwordHash]
    );

    let demoResult = { cloned: false };
    if (cloneDemo) {
      demoResult = await demoClonerService.clone(pool, tenantId);
    }

    const token = issueToken({ id: userId, tenant_id: tenantId, role_code: 'owner' });
    res.json({ token, demo: demoResult });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/login -> password check, then either a full token or a 2FA
// challenge (challengeToken + which method to prompt for).
// ---------------------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email i password su obavezni.' });
    }

    const [rows] = await pool.query(
      `SELECT u.*, r.code as role_code FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? AND u.active = 1`,
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Pogrešan email ili lozinka.' });
    }
    const user = rows[0];

    const valid = await passwordService.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Pogrešan email ili lozinka.' });
    }

    if (user.two_factor_enabled) {
      const challengeToken = issueChallengeToken(user.id);
      if (user.two_factor_method === 'email') {
        const code = await twoFactorService.createEmailOtp(pool, user.id);
        await mailService.send({
          to: user.email,
          subject: 'eVinarija — kod za prijavu',
          html: `<p>Vaš kod za prijavu je: <strong>${code}</strong> (važi ${10} minuta).</p>`
        });
      }
      return res.json({ requires2fa: true, method: user.two_factor_method, challengeToken });
    }

    res.json({ token: issueToken(user), onboarded: !!user.onboarded_at });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/forgot-password -> emails a reset link if the address exists.
// Always responds { sent: true } regardless, to avoid leaking which emails
// are registered.
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email je obavezan.' });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ? AND active = 1', [email]);
    if (rows.length) {
      const user = rows[0];
      const token = randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await pool.query('INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)', [
        randomUUID(),
        user.id,
        tokenHash,
        expiresAt
      ]);

      const resetUrl = `${process.env.CLIENT_ORIGIN || ''}/auth/recovery-password/${token}`;
      await mailService.send({
        to: email,
        subject: 'eVinarija — resetovanje lozinke',
        html: `<p>Kliknite na link da resetujete lozinku (važi 30 minuta): <a href="${resetUrl}">${resetUrl}</a></p>`
      });
    }

    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/reset-password -> consumes a forgot-password token and sets a
// new password.
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'token i password su obavezni.' });
    }

    const [candidates] = await pool.query(
      `SELECT id, user_id, token_hash FROM password_resets
       WHERE consumed_at IS NULL AND expires_at > NOW()`
    );

    let match = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(token, candidate.token_hash)) {
        match = candidate;
        break;
      }
    }

    if (!match) {
      return res.status(400).json({ message: 'Link za reset nije validan ili je istekao.' });
    }

    const passwordHash = await passwordService.hash(password);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, match.user_id]);
    await pool.query('UPDATE password_resets SET consumed_at = NOW() WHERE id = ?', [match.id]);

    res.json({ reset: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/2fa/verify -> completes login started by /login when 2FA is on.
// ---------------------------------------------------------------------------
router.post('/2fa/verify', async (req, res, next) => {
  try {
    const { challengeToken, code } = req.body;
    if (!challengeToken || !code) {
      return res.status(400).json({ message: 'challengeToken i code su obavezni.' });
    }

    let payload;
    try {
      payload = jwt.verify(challengeToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Challenge token nije validan ili je istekao.' });
    }
    if (payload.purpose !== '2fa_challenge') {
      return res.status(401).json({ message: 'Nevalidan challenge token.' });
    }

    const [rows] = await pool.query(
      `SELECT u.*, r.code as role_code FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      [payload.sub]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Korisnik nije pronađen.' });
    }
    const user = rows[0];

    const valid =
      user.two_factor_method === 'totp'
        ? await twoFactorService.verifyTotp(code, user.two_factor_secret)
        : await twoFactorService.verifyEmailOtp(pool, user.id, code);

    if (!valid) {
      return res.status(401).json({ message: 'Kod nije ispravan.' });
    }

    res.json({ token: issueToken(user), onboarded: !!user.onboarded_at });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 2FA management (requires an authenticated session)
// ---------------------------------------------------------------------------
router.post('/2fa/setup-totp', authenticateToken, async (req, res, next) => {
  try {
    const [[user]] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.sub]);
    const secret = twoFactorService.generateTotpSecret();
    await pool.query('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret, req.user.sub]);
    const qrCodeDataUrl = await twoFactorService.totpQrCodeDataUrl(user.email, secret);
    res.json({ secret, qrCodeDataUrl });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/enable-totp', authenticateToken, async (req, res, next) => {
  try {
    const { code } = req.body;
    const [[user]] = await pool.query('SELECT two_factor_secret FROM users WHERE id = ?', [req.user.sub]);
    if (!user.two_factor_secret || !(await twoFactorService.verifyTotp(code, user.two_factor_secret))) {
      return res.status(400).json({ message: 'Kod nije ispravan.' });
    }
    await pool.query("UPDATE users SET two_factor_enabled = 1, two_factor_method = 'totp' WHERE id = ?", [
      req.user.sub
    ]);
    res.json({ enabled: true, method: 'totp' });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/enable-email', authenticateToken, async (req, res, next) => {
  try {
    await pool.query("UPDATE users SET two_factor_enabled = 1, two_factor_method = 'email' WHERE id = ?", [
      req.user.sub
    ]);
    res.json({ enabled: true, method: 'email' });
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/disable', authenticateToken, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE users SET two_factor_enabled = 0, two_factor_method = NULL, two_factor_secret = NULL WHERE id = ?',
      [req.user.sub]
    );
    res.json({ enabled: false });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/onboarding/complete -> dismiss the welcome popup for good.
// ---------------------------------------------------------------------------
router.post('/onboarding/complete', authenticateToken, async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET onboarded_at = NOW() WHERE id = ?', [req.user.sub]);
    res.json({ onboarded: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
