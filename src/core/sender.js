const { api } = require('./http');

function toLocalDateTimeNoTZ(tsLike) {
  const d = tsLike ? new Date(tsLike) : new Date();
  const pad = n => String(n).padStart(2,'0');
  const yyyy = d.getUTCFullYear(), MM = pad(d.getUTCMonth()+1), dd = pad(d.getUTCDate());
  const HH = pad(d.getUTCHours()), mm = pad(d.getUTCMinutes()), ss = pad(d.getUTCSeconds());
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`; // LocalDateTime (UTC sin Z)
}

function toGeo(loc, fallback = { lat: 4.6510, lng: -74.0836 }) {
  let lat, lng;
  if (Array.isArray(loc)) { lat = Number(loc[0]); lng = Number(loc[1]); }
  else if (loc && typeof loc === 'object') {
    lat = Number(loc.lat ?? loc.latitude);
    lng = Number(loc.lng ?? loc.lon ?? loc.longitude);
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return fallback;
}

function toBackendPayload(sim, sessionId, panelId) {
  const geo = toGeo(sim?.location);
  return {
    sessionId,
    panelId,
    timestamp: toLocalDateTimeNoTZ(sim?.timestamp),
    temperature: sim?.temperature,
    humidity: sim?.humidity,
    // 👇 claves que espera el backend
    dustLevel: sim?.dust_level ?? sim?.dust,
    powerOutput: sim?.power_output ?? sim?.power,
    vibration: sim?.vibration,
    microFractureRisk: sim?.micro_fracture_risk ?? sim?.microFractureRisk,
    ...(geo ? { location: geo } : {})
  };
}


async function sendTelemetry(sim, sessionId, panelId) {
  const body = toBackendPayload(sim, sessionId, panelId);
  await api.post('/api/telemetry', body);
}

module.exports = { sendTelemetry };
