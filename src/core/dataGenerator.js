const { generateVariableValue } = require('../utils/random');
const { evaluateRisk } = require('./riskEvaluator');
const { panelId, location } = require('../config');

// Identificador único generado al inicio de la sesión
const sessionId = generateSessionId();

// Contador para simular movimiento progresivo
let step = 0;

// Número total de pasos simulados durante una sesión
const maxSteps = 100;

/**
 * Genera un identificador único para la sesión actual,
 * basado en la marca de tiempo en milisegundos.
 *
 * @returns {string} ID único de sesión, ej. 'session-1721741836425'
 */
function generateSessionId() {
  const now = new Date();
  return `session-${now.getTime()}`;
}

/**
 * Calcula una variación incremental sobre la latitud o longitud base,
 * simulando un movimiento tipo zigzag o barrido progresivo.
 *
 * @param {number} base - Coordenada base (lat o lng)
 * @param {number} step - Número de paso actual
 * @param {number} maxSteps - Total estimado de pasos por sesión
 * @returns {number} Nueva coordenada modificada
 */
function simulatePositionStep(base, step, maxSteps) {
  const delta = 0.0001; // magnitud del desplazamiento
  const offset = (step % 2 === 0 ? 1 : -1) * (step / maxSteps) * delta;
  return +(base + offset).toFixed(6);
}

/**
 * Genera un objeto completo simulando una lectura de sensores del robot de limpieza.
 * Incluye temperatura, humedad, polvo, vibración, producción energética estimada,
 * riesgo de microfractura, ubicación simulada y session_id persistente.
 *
 * @returns {object} Datos simulados de una lectura única
 */
function generateSensorData() {
  const timestamp = new Date().toISOString();

  // Generación de variables dependientes del escenario activo
  const temperature = generateVariableValue('temperature');
  const humidity = generateVariableValue('humidity');
  const dustLevel = generateVariableValue('dust_level');
  const vibration = generateVariableValue('vibration');

  // Cálculo del rendimiento energético afectado por el polvo
  const powerOutput = +(250 * (1 - dustLevel / 100)).toFixed(2);

  // Evaluación de riesgo de microfractura con base en condiciones
  const microFractureRisk = evaluateRisk(temperature, vibration, powerOutput, dustLevel);

  // Simulación de posición geográfica según desplazamiento
  const simulatedLocation = {
    lat: simulatePositionStep(location.lat, step, maxSteps),
    lng: simulatePositionStep(location.lng, step, maxSteps)
  };

  // Avance del paso para siguiente lectura
  step++;

  // Retorno del objeto de lectura
  return {
    session_id: sessionId,
    panel_id: panelId,
    timestamp,
    temperature,
    humidity,
    dust_level: dustLevel,
    power_output: powerOutput,
    vibration,
    micro_fracture_risk: microFractureRisk,
    location: simulatedLocation
  };
}

// Exportación del generador de datos
module.exports = { generateSensorData };
