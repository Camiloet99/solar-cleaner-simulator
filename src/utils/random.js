// src/utils/random.js

const SCENARIOS = require('../config/scenarios');
const { log } = require('./logger');

// Variable que almacena el escenario activo de simulación
let activeScenario = null;

/**
 * Selecciona aleatoriamente uno de los escenarios definidos en /config/scenarios.js.
 * Asigna el escenario a 'activeScenario' y registra el nombre en logs.
 */
function pickRandomScenario() {
  const keys = Object.keys(SCENARIOS);
  const selectedKey = keys[Math.floor(Math.random() * keys.length)];
  activeScenario = SCENARIOS[selectedKey];
  activeScenario.__key = selectedKey; // se guarda el nombre clave del escenario
  log(`Escenario seleccionado aleatoriamente: ${selectedKey} — ${activeScenario.label}`);
}

/**
 * Retorna el nombre clave del escenario activo actual.
 * Si no se ha seleccionado ninguno, retorna 'undefined'.
 */
function getActiveScenarioKey() {
  return activeScenario?.__key || 'undefined';
}

/**
 * Genera un valor numérico aleatorio centrado en 'base' con desviación 'variance',
 * y posibilidad de generar un valor atípico (anomalía) si se cumple la probabilidad definida.
 *
 * @param {number} base - Valor medio esperado
 * @param {number} variance - Rango máximo de variación normal
 * @param {number} anomalyProbability - Probabilidad de generar un valor anómalo
 * @param {number} anomalyMagnitude - Multiplicador de la desviación en caso de anomalía
 * @returns {number} Valor generado con dos decimales
 */
function biasedRandom(base, variance, anomalyProbability = 0, anomalyMagnitude = 1.5) {
  const shouldAnomaly = Math.random() < anomalyProbability;

  const shift = shouldAnomaly
    ? (Math.random() < 0.5 ? -1 : 1) * variance * anomalyMagnitude // anomalía
    : (Math.random() * 2 - 1) * variance;                          // variación normal

  return +(base + shift).toFixed(2);
}

/**
 * Genera un valor para una variable específica según la configuración del escenario activo.
 *
 * @param {string} varName - Nombre de la variable (ej: 'temperature', 'dust_level')
 * @returns {number} Valor simulado ajustado al escenario
 * @throws Error si no hay escenario activo o la variable no está definida
 */
function generateVariableValue(varName) {
  if (!activeScenario)
    throw new Error('No hay escenario activo. Ejecuta pickRandomScenario() antes de generar valores.');

  const conf = activeScenario[varName];

  if (!conf)
    throw new Error(`Variable '${varName}' no está definida en el escenario.`);

  return biasedRandom(conf.base, conf.variance, activeScenario.anomalyProbability);
}

// Exportación de funciones
module.exports = {
  pickRandomScenario,
  getActiveScenarioKey,
  generateVariableValue
};
