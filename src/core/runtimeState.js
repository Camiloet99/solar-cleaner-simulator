// src/core/runtimeState.js
const cfg = require('../config');
const { paramsForMode } = require('../config/modes');
const { EventEmitter } = require('events');

/**
 * Estado con rampas y bus de eventos:
 * - paramsCurr: valores aplicados (suavizados)
 * - paramsTgt : objetivo
 * - getEventBus(): emite 'state_change', 'param_change', 'param_change_bulk'
 */

const bus = new EventEmitter();

let version = 0;
let mode = String(cfg.cleaningMode || 'REGULAR').toUpperCase();
let lastChangeTs = new Date().toISOString();
let cause;

const RANGES = {
  robotSpeed: [0, 1.5],
  brushRpm: [0, 1500],
  waterPressure: [0, 8],
  detergentFlowRate: [0, 2],
  vacuumPower: [0, 1],
  turnRadius: [0.2, 2],
  passOverlap: [0, 100],
  pathSpacing: [0.2, 1.5],
  squeegeePressure: [0, 100],
  dwellTime: [0, 60],
  rpmRampRate: [10, 500],
  maxWaterPerMin: [0, 5],
  maxEnergyPerMin: [0, 200],
};

function clamp(val, [a, b]) {
  return Math.min(b, Math.max(a, val));
}
function clampParam(p, v) {
  return RANGES[p] ? clamp(Number(v), RANGES[p]) : Number(v);
}

const MAX_RATE_PER_SEC = {
  robotSpeed: 0.5,
  waterPressure: 1.0,
  detergentFlowRate: 0.5,
  vacuumPower: 0.5,
  turnRadius: 0.5,
  passOverlap: 20,
  pathSpacing: 0.4,
  squeegeePressure: 50,
  dwellTime: 5,
  maxWaterPerMin: 2,
  maxEnergyPerMin: 50,
};

function moveTowards(curr, tgt, maxDelta) {
  const delta = tgt - curr;
  if (Math.abs(delta) <= maxDelta) return tgt;
  return curr + Math.sign(delta) * maxDelta;
}

function actuatorRequiredForParam(param) {
  if (['waterPressure', 'detergentFlowRate', 'dwellTime', 'squeegeePressure', 'pathSpacing'].includes(param)) return 'hasWaterPump';
  if (['brushRpm', 'rpmRampRate', 'passOverlap'].includes(param)) return 'hasBrush';
  if (['vacuumPower'].includes(param)) return 'hasVacuum';
  return null;
}
function canSetParam(param) {
  const need = actuatorRequiredForParam(param);
  if (!need) return { ok: true };
  if (!cfg.actuators || !cfg.actuators[need]) return { ok: false, reason: `actuator ${need} is not available` };
  return { ok: true };
}

let paramsCurr = paramsForMode(mode);
let paramsTgt = { ...paramsCurr };

const changesLog = [];
function logChange(evt) {
  changesLog.push(evt);
  if (changesLog.length > 50) changesLog.shift();
  // consola (auditoría)
  const compact = {
    ts: evt.ts,
    type: evt.type,
    cause: evt.cause,
    version: evt.version,
    prevMode: evt.prev?.mode,
    nextMode: evt.next?.mode,
    details: evt.details,
  };
  console.log('[audit]', JSON.stringify(compact));
  // emitir por bus
  bus.emit(evt.type, evt);
  bus.emit('any_change', evt);
}

function getState() { return { mode, lastChangeTs, cause }; }
function getParams() { return { ...paramsCurr }; }
function getTargets() { return { ...paramsTgt }; }
function getVersion() { return version; }
function getRuntimeSnapshot() {
  return {
    version,
    state: getState(),
    params: getParams(),
    targetParams: getTargets(),
    lastChangeTs,
    cause,
    recentChanges: [...changesLog].slice(-20),
  };
}
function getEventBus() { return bus; }

function advance(dtMs) {
  const dt = Math.max(1, Number(dtMs || cfg.intervalMs || 1000)) / 1000.0;

  // brushRpm con su propia rampa
  {
    const rate = clampParam('rpmRampRate', paramsCurr.rpmRampRate || 100);
    const maxDelta = Math.max(1, rate * dt);
    paramsCurr.brushRpm = moveTowards(paramsCurr.brushRpm, paramsTgt.brushRpm, maxDelta);
  }
  for (const k of Object.keys(paramsCurr)) {
    if (k === 'brushRpm') continue;
    if (!(k in paramsTgt)) continue;
    const rate = MAX_RATE_PER_SEC[k] ?? Infinity;
    const maxDelta = rate === Infinity ? Infinity : Math.max(1e-6, rate * dt);
    paramsCurr[k] = moveTowards(paramsCurr[k], paramsTgt[k], maxDelta);
  }
  for (const k of Object.keys(paramsCurr)) {
    paramsCurr[k] = clampParam(k, paramsCurr[k]);
  }
}

function setMode(newMode, changeCause) {
  const prev = { mode, params: { ...paramsCurr } };
  mode = String(newMode || 'REGULAR').toUpperCase();
  paramsTgt = paramsForMode(mode);
  lastChangeTs = new Date().toISOString();
  cause = changeCause;
  version += 1;

  const next = { mode, params: { ...paramsTgt } };
  logChange({ ts: lastChangeTs, type: 'state_change', cause, version, prev, next });
  return { mode, params: { ...paramsTgt }, version, lastChangeTs, cause };
}

function setParam(param, value, changeCause) {
  const chk = canSetParam(param);
  if (!chk.ok) return { error: 'capability error', details: chk.reason, code: 422 };

  const prev = { mode, params: { ...paramsCurr } };
  const clamped = clampParam(param, value);
  paramsTgt[param] = clamped;

  lastChangeTs = new Date().toISOString();
  cause = changeCause;
  version += 1;

  logChange({
    ts: lastChangeTs,
    type: 'param_change',
    cause,
    version,
    prev,
    next: { mode, params: { ...paramsTgt } },
    details: { param, value, clampedApplied: clamped !== value },
  });

  return { mode, params: { ...paramsTgt }, version, lastChangeTs, cause, clampedChanged: clamped !== value };
}

function setParamsBulk(partial, changeCause) {
  const copy = { ...paramsTgt };
  for (const [k, v] of Object.entries(partial || {})) {
    const chk = canSetParam(k);
    if (!chk.ok) return { error: 'capability error', details: { param: k, reason: chk.reason }, code: 422 };
    copy[k] = clampParam(k, v);
  }
  const prev = { mode, params: { ...paramsCurr } };
  paramsTgt = copy;
  lastChangeTs = new Date().toISOString();
  cause = changeCause;
  version += 1;

  logChange({
    ts: lastChangeTs,
    type: 'param_change_bulk',
    cause,
    version,
    prev,
    next: { mode, params: { ...paramsTgt } },
    details: { changed: Object.keys(partial || {}) }
  });

  return { mode, params: { ...paramsTgt }, version, lastChangeTs, cause };
}

function getParamsForTick(dtMs) { advance(dtMs); return getParams(); }

module.exports = {
  getState, getParams, getTargets, getVersion, getRuntimeSnapshot, getEventBus,
  getParamsForTick,
  setMode, setParam, setParamsBulk,
};
