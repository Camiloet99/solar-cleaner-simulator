require('dotenv').config();

const { panelId, intervalMs, sessionDurationMs, debug } = require('./config');
const { startSession, stopSession } = require('./core/sessionClient');
const { sendTelemetry } = require('./core/sender');
const { generateSensorData } = require('./core/dataGenerator');
const { pickRandomScenario, getActiveScenarioKey } = require('./utils/random');

(async () => {
  try {
    pickRandomScenario?.();
    console.log('▶ Iniciando simulador');
    console.log('· Panel:', panelId);
    console.log('· Escenario:', getActiveScenarioKey?.() || 'default');

    const sessionId = await startSession(panelId, { scenario: getActiveScenarioKey?.() });
    console.log('· sessionId:', sessionId);

    const tick = async () => {
      const sim = generateSensorData();
      try {
        await sendTelemetry(sim, sessionId, panelId);
        if (debug) console.log('ok', new Date().toISOString());
      } catch (e) {
        console.warn('fallo envío:', e?.message || e);
      }
    };

    // primer envío inmediato
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
