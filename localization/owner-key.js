/* lib/owner-key.js — ownership proof for ANONYMOUS profiles.

   The dashboard has no Supabase session: its uid is a random string minted
   in localStorage (shubhdin_uid). So "verify the access_token" cannot apply
   to save-user.js / feedback.js — there is no token. Instead each install
   also mints a write_key (32 hex chars). The users row stores sha256(key);
   a write must present the key that hashes to it.

   Transition, so no existing install breaks:
     · row has a stored hash  → the key is REQUIRED and must match (401)
     · row has no hash yet    → the first write that brings a key claims it;
                                a legacy client that sends none still writes
                                (logged) — the new dashboard sends one, so
                                rows get claimed on their next save
     · no row                 → inserted with the hash
     · the column is missing  → FAIL OPEN with a loud console.error: the
                                one-line SQL in the handover adds it. Auth
                                must never be the thing that breaks signup.
   Uses the SERVICE key; RLS on users returns [] to the anon key. */
const crypto = require('crypto');
const KEY_RE = /^[a-f0-9]{32,64}$/i;
const hash = (k) => crypto.createHash('sha256').update(String(k)).digest('hex');

/* returns { ok:true, claim?:hash } or { ok:false, status, error } */
exports.checkOwner = async function checkOwner(supabaseUrl, serviceKey, uid, writeKey) {
  const H = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
  if (writeKey !== undefined && writeKey !== null && writeKey !== '' && !KEY_RE.test(String(writeKey)))
    return { ok: false, status: 400, error: 'bad write_key' };
  let rows;
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/users?uid=eq.${encodeURIComponent(uid)}&select=write_key`, { headers: H });
    if (r.status === 400) {           // column not there yet
      console.error('[owner-key] users.write_key column missing — profile writes are UNPROTECTED. Run: alter table users add column if not exists write_key text;');
      return { ok: true, open: true };
    }
    if (!r.ok) return { ok: false, status: 500, error: 'owner lookup failed' };
    rows = await r.json();
  } catch (e) { return { ok: false, status: 500, error: 'owner lookup failed' }; }
  const stored = Array.isArray(rows) && rows[0] ? rows[0].write_key : undefined;
  if (stored) {
    if (!writeKey) return { ok: false, status: 401, error: 'write_key required' };
    if (hash(writeKey) !== stored) return { ok: false, status: 401, error: 'not the owner of this profile' };
    return { ok: true };
  }
  if (writeKey) return { ok: true, claim: hash(writeKey) };
  console.warn('[owner-key] legacy write without write_key for uid ' + String(uid).slice(0, 6) + '… — allowed until the row is claimed');
  return { ok: true, legacy: true };
};
exports.hashKey = hash;
