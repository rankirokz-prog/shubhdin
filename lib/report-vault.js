const crypto = require('crypto');

function key() {
  const raw = String(process.env.SD_REPORT_DATA_KEY || '').trim();
  if (!raw) throw new Error('SD_REPORT_DATA_KEY missing');
  const decoded = Buffer.from(raw, 'base64');
  return decoded.length === 32 ? decoded : crypto.createHash('sha256').update(raw).digest();
}

exports.seal = function (value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), body.toString('base64url')].join('.');
};

exports.open = function (token) {
  const p = String(token || '').split('.');
  if (p.length !== 4 || p[0] !== 'v1') throw new Error('bad report snapshot');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(p[1], 'base64url'));
  decipher.setAuthTag(Buffer.from(p[2], 'base64url'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(p[3], 'base64url')), decipher.final()]).toString('utf8'));
};

exports.digest = function (value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
};
