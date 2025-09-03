const { api } = require('./http');

function toLocalDateTimeNoTZ(tsLike) {
  const d = tsLike ? new Date(tsLike) : new Date();
  const pad = n => String(n).padStart(2,'0');
  const yyyy = d.getUTCFullYear(), MM = pad(d.getUTCMonth()+1), dd = pad(d.getUTCDate());
  const HH = pad(d.getUTCHours()), mm = pad(d.getUTCMinutes()), ss = pad(d.getUTCSeconds());
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
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
  const geo = sim?.location ? toGeo(sim.location) : undefined;
  const state = sim?.state ? {
    mode: sim.state.mode,
    lastChangeTs: sim.state.lastChangeTs,
    cause: sim.state.cause
  } : undefined;

  const params = sim?.params ? { ...sim.params } : undefined;

  return {
    sessionId,
    panelId,
    timestamp: toLocalDateTimeNoTZ(sim?.timestamp),
    temperature: sim?.temperature,
    humidity: sim?.humidity,
    dustLevel: sim?.dust_level ?? sim?.dust,
    powerOutput: sim?.power_output ?? sim?.power,
    vibration: sim?.vibration,
    microFractureRisk: sim?.micro_fracture_risk ?? sim?.microFractureRisk,
    ...(geo ? { location: geo } : {}),

    ...(state ? { state } : {}),
    ...(params ? { params } : {})
  };
}

async function sendParamChange(evt, sessionId, panelId) {
  if (!evt || (evt.type !== 'param_change' && evt.type !== 'param_change_bulk')) return;

  const body = {
    type: evt.type,                    
    sessionId,
    panelId,
    version: evt.version,
    timestamp: (function toLocal(tsLike){
      const d = tsLike ? new Date(tsLike) : new Date();
      const pad = n => String(n).padStart(2,'0');
      const yyyy = d.getUTCFullYear(), MM = pad(d.getUTCMonth()+1), dd = pad(d.getUTCDate());
      const HH = pad(d.getUTCHours()), mm = pad(d.getUTCMinutes()), ss = pad(d.getUTCSeconds());
      return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
    })(evt.ts),
    cause: evt.cause,
    details: evt.details || undefined, 
    paramsTarget: evt.next?.params || undefined
  };

  const path = '/api/telemetry/state-change';
  await api.post(path, body);
}

async function sendTelemetry(sim, sessionId, panelId) {
  const body = toBackendPayload(sim, sessionId, panelId);
  await api.post('/api/telemetry', body);
}

async function sendStateChange(evt, sessionId, panelId) {
  if (!evt || evt.type !== 'state_change') return;

  const body = {
    type: 'state_change',
    sessionId,
    panelId,
    version: evt.version,
    timestamp: toLocalDateTimeNoTZ(evt.ts),
    cause: evt.cause,
    prev: { mode: evt.prev?.mode },
    next: { mode: evt.next?.mode },
    paramsTarget: evt.next?.params || undefined
  };

  const path = '/api/telemetry/state-change';
  console.log(path);
  console.log(body);
  await api.post(path, body);
}

module.exports = {
  sendTelemetry,
  sendStateChange,
  sendParamChange,   
};