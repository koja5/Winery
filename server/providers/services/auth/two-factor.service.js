const { generateSecret, generateURI, verify: verifyOtp } = require('otplib');
const QRCode = require('qrcode');
const { randomInt, randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

const EMAIL_OTP_TTL_MINUTES = 10;

class TwoFactorService {
  // ---- TOTP (authenticator app) ------------------------------------------

  generateTotpSecret() {
    return generateSecret();
  }

  async totpQrCodeDataUrl(email, secret) {
    const otpauthUrl = generateURI({ issuer: 'eVinarija', label: email, secret });
    return QRCode.toDataURL(otpauthUrl);
  }

  async verifyTotp(token, secret) {
    try {
      const result = await verifyOtp({ token, secret });
      return !!result?.valid;
    } catch {
      return false;
    }
  }

  // ---- Email OTP -----------------------------------------------------------

  async createEmailOtp(pool, userId) {
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + EMAIL_OTP_TTL_MINUTES * 60 * 1000);

    await pool.query('INSERT INTO login_otps (id, user_id, code_hash, expires_at) VALUES (?,?,?,?)', [
      randomUUID(),
      userId,
      codeHash,
      expiresAt
    ]);

    return code;
  }

  async verifyEmailOtp(pool, userId, code) {
    const [rows] = await pool.query(
      `SELECT id, code_hash FROM login_otps
       WHERE user_id = ? AND consumed_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (!rows.length) return false;

    const valid = await bcrypt.compare(code, rows[0].code_hash);
    if (!valid) return false;

    await pool.query('UPDATE login_otps SET consumed_at = NOW() WHERE id = ?', [rows[0].id]);
    return true;
  }
}

module.exports = new TwoFactorService();
