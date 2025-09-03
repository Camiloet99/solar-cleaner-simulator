require('dotenv').config();

const { panelId, intervalMs, sessionDurationMs, debug } = require('./config');
const { startSession, stopSession } = require('./core/sessionClient');
const { sendTelemetry, sendStateChange, sendParamChange } = require('./core/sender');
const { generateSensorData } = require('./core/dataGenerator');
const { pickRandomScenario, getActiveScenarioKey } = require('./utils/random');

const cfg = require('./config'); 
const { startControlServer } = require('./control/controlServer');
const runtimeState = require('./core/runtimeState');
const { getEventBus } = require('./core/runtimeState');

function nowIso() {
  return new Date().toISOString();
}

async function applyCommand(cmd) {
  const acceptedAt = nowIso();

  // (opcional) Si quisieras validar contra un robotId específico, descomenta:
  // if (cmd.robotId && cmd.robotId !== panelId) {
  //   return { error: 'robotId mismatch', details: { expected: panelId, got: cmd.robotId }, code: 409 };
  // }

  if (!cmd || !cmd.type) {
    return { error: 'type is required', code: 422 };
  }
  if (!cmd.cause) {
    return { error: 'cause is required', code: 422 };
  }

  const currentVersion = runtimeState.getVersion();
  if (cmd.expectedVersion !== undefined && cmd.expectedVersion !== currentVersion) {
    return { error: 'version conflict', details: { expected: cmd.expectedVersion, current: currentVersion }, code: 409 };
  }

  const prev = { mode: runtimeState.getState().mode, params: runtimeState.getParams() };
  let warnings = [];

  switch (cmd.type) {
    case 'SET_STATE': {
      if (!cmd.state) return { error: 'state required', code: 422 };
      const res = runtimeState.setMode(cmd.state, cmd.cause);
      return {
        acceptedAt,
        appliedAt: nowIso(),
        version: res.version,
        prev,
        next: { mode: res.mode, params: res.params },
      };
    }

    case 'SET_PARAM': {
      const { param, value } = cmd;
      if (!param || value === undefined) return { error: 'param and value required', code: 422 };
      const r = runtimeState.setParam(param, value, cmd.cause);
      if (r.error) return r; 
      if (r.clampedChanged) warnings.push(`value for ${param} was clamped`);
      return {
        acceptedAt,
        appliedAt: nowIso(),
        version: r.version,
        prev,
        next: { mode: r.mode, params: r.params },
        warnings: warnings.length ? warnings : undefined
      };
    }

    case 'SET_PARAMS_BULK': {
      const r = runtimeState.setParamsBulk(cmd.params || {}, cmd.cause);
      if (r.error) return r;
      return {
        acceptedAt,
        appliedAt: nowIso(),
        version: r.version,
        prev,
        next: { mode: r.mode, params: r.params }
      };
    }

    case 'PAUSE': {
      const r = runtimeState.setMode('IDLE', cmd.cause);
      return {
        acceptedAt,
        appliedAt: nowIso(),
        version: r.version,
        prev,
        next: { mode: r.mode, params: r.params }
      };
    }

    case 'RESUME': {
      const r = runtimeState.setMode('REGULAR', cmd.cause);
      return {
        acceptedAt,
        appliedAt: nowIso(),
        version: r.version,
        prev,
        next: { mode: r.mode, params: r.params }
      };
    }

    default:
      return { error: 'unsupported command', details: cmd.type, code: 400 };
  }
}

(async () => {
  try {
    if (cfg.controlServer?.enabled) {
      startControlServer(
        { port: cfg.controlServer.port, apiKey: cfg.controlServer.apiKey },
        applyCommand
      );
    }

    pickRandomScenario?.();
    console.log('▶ Iniciando simulador');
    console.log('· Panel:', panelId);
    console.log('· Escenario:', getActiveScenarioKey?.() || 'default');
    console.log('· Control plane:', cfg.controlServer?.enabled ? `http://localhost:${cfg.controlServer.port}` : 'disabled');

    const sessionId = await startSession(panelId, { scenario: getActiveScenarioKey?.() });
    console.log('· sessionId:', sessionId);

    const bus = getEventBus();
    bus.on('state_change', async (evt) => {
      try {
        await sendStateChange(evt, sessionId, panelId);
        if (debug) console.log('[event] state_change enviado', { version: evt.version, ts: evt.ts, nextMode: evt.next?.mode });
      } catch (e) {
        console.warn('fallo envío state_change:', e?.message || e);
      }
    });
    bus.on('param_change', async (evt) => {
      try {
        await sendParamChange(evt, sessionId, panelId);
        if (debug) console.log('[event] param_change enviado', { version: evt.version, ts: evt.ts, param: evt?.details?.param });
      } catch (e) {
        console.warn('fallo envío param_change:', e?.message || e);
      }
    });
    bus.on('param_change_bulk', async (evt) => {
      try {
        await sendParamChange(evt, sessionId, panelId);
        if (debug) console.log('[event] param_change_bulk enviado', { version: evt.version, ts: evt.ts, changed: evt?.details?.changed });
      } catch (e) {
        console.warn('fallo envío param_change_bulk:', e?.message || e);
      }
    });

    const tick = async () => {
      const sim = generateSensorData();
      console.log('data: ', sim);
      try {
        await sendTelemetry(sim, sessionId, panelId);
        if (debug) console.log('ok', new Date().toISOString());
      } catch (e) {
        console.warn('fallo envío:', e?.message || e);
      }
    };

    await tick();

    const intId = setInterval(tick, intervalMs);

    setTimeout(async () => {
      clearInterval(intId);
      await stopSession(sessionId);
      console.log('✅ Simulación finalizada:', sessionId);
    }, sessionDurationMs);

  } catch (e) {
    console.error('❌ Error al iniciar simulador:', e?.message || e);
    process.exit(1);
  }
})();
