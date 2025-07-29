const { generateSensorData } = require('./core/dataGenerator');
const { sendData } = require('./core/sender');
const { log, error } = require('./utils/logger');
const { intervalMs, sessionDurationMs } = require('./config');
const { pickRandomScenario, getActiveScenarioKey } = require('./utils/random');

function startSimulation() {
  try {
    log('=== Iniciando simulación de sesión de limpieza ===');
    pickRandomScenario();

    const initialData = generateSensorData();
    const sessionId = initialData.session_id;

    log(`session_id: ${sessionId}`);
    log(`Escenario: ${getActiveScenarioKey()}`);
    log(`Intervalo: ${intervalMs / 1000} segundos`);
    log(`Duración: ${(sessionDurationMs / 1000 / 60).toFixed(1)} minutos`);

    sendData(initialData);

    const interval = setInterval(async () => {
      const data = generateSensorData();
      await sendData(data);
    }, intervalMs);

    setTimeout(() => {
      clearInterval(interval);
      log(`✅ Simulación finalizada — session_id: ${sessionId}`);
    }, sessionDurationMs);

  } catch (e) {
    error(`Fallo al iniciar la simulación: ${e.message}`);
    process.exit(1);
  }
}

startSimulation();
