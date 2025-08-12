const { api } = require('./http');

async function startSession(panelId, meta = {}) {
  const res = await api.post('/api/sessions/start', { panelId, meta });
  return res.data.sessionId; // ← usar este ID en todas las lecturas
}

async function stopSession(sessionId) {
  try { await api.post(`/api/sessions/${encodeURIComponent(sessionId)}/stop`); }
  catch { /* opcional: log */ }
}

module.exports = { startSession, stopSession };
