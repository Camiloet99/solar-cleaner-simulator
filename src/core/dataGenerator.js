const { generateVariableValue } = require('../utils/random');
const { evaluateRisk } = require('./riskEvaluator');
const cfg = require('../config'); // <- trae panelId y (opcional) location

let step = 0;
const maxSteps = 100;

function normalizeLocation(loc) {
  let lat, lng;

  if (Array.isArray(loc)) {
    lat = Number(loc[0]); lng = Number(loc[1]);
  } else if (loc && typeof loc === 'object') {
    lat = Number(loc.lat ?? loc.latitude);
    lng = Number(loc.lng ?? loc.lon ?? loc.longitude);
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    lat = cfg?.location?.lat ?? Number(process.env.LAT) ?? 4.6510;
    lng = cfg?.location?.lng ?? Number(process.env.LNG) ?? -74.0836;
  }

  return { lat: Number(lat), lng: Number(lng) };
}

const baseLocation = normalizeLocation(cfg?.location);

// Desplazamiento pequeño alrededor de la base
function simulatePositionStep(base, step, maxSteps) {
  const delta = 0.0001;
  const offset = (step % 2 === 0 ? 1 : -1) * (step / maxSteps) * delta;
  return +(Number(base) + offset).toFixed(6);
}

function generateSensorData() {
  const timestamp = new Date().toISOString();

  const temperature = generateVariableValue('temperature');
  const humidity    = generateVariableValue('humidity');
  const dustLevel   = generateVariableValue('dust_level');
  const vibration   = generateVariableValue('vibration');

  const powerOutput = +(250 * (1 - dustLevel / 100)).toFixed(2);
  const microFractureRisk = evaluateRisk(temperature, vibration, powerOutput, dustLevel);

  const simulatedLocation = {
    lat: simulatePositionStep(baseLocation.lat, step, maxSteps),
    lng: simulatePositionStep(baseLocation.lng, step, maxSteps),
  };

  step++;

  return {
    timestamp,
    temperature,
    humidity,
    dust_level: dustLevel,
    power_output: powerOutput,
    vibration,
    micro_fracture_risk: microFractureRisk,
    location: simulatedLocation,
  };
}

module.exports = { generateSensorData };
