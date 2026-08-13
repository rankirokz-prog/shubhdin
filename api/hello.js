// api/hello.js — POC rung 1: no imports at all.
// If this fails, the problem is the platform/deploy, not our code.
export default function handler(req, res) {
  res.status(200).json({ rung: 1, ok: true, node: process.version, time: new Date().toISOString() });
}
