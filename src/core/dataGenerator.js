const { generateVariableValue } = require('../utils/random');
const { evaluateRisk } = require('./riskEvaluator');
const cfg = require('../config'); // trae panelId, location, sensors, actuators, cleaningMode
const { paramsForMode } = require('../config/modes');

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
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

const runtimeState = require('./runtimeState');

function generateSensorData(now = new Date(), baseLocation = cfg.defaultLocation) {
  step = (step + 1) % maxSteps;

  const temperatureVal = generateVariableValue('temperature');   // °C
  const humidityVal    = generateVariableValue('humidity');      // %
  const dustVal        = generateVariableValue('dust_level');    // 0..100
  const vibrationVal   = generateVariableValue('vibration');     // g-equivalent (arbitrario)

  const powerOutputVal = Math.max(0, +(300 - dustVal * 1.2 + (temperatureVal < 40 ? 20 : -10)).toFixed(2));
  const microFractureRiskVal = evaluateRisk(temperatureVal, vibrationVal, powerOutputVal, dustVal);

  const loc = normalizeLocation(baseLocation);
  const simulatedLocation = loc
    ? {
        lat: +(loc.lat + (Math.random() - 0.5) * 0.0002).toFixed(6),
        lng: +(loc.lng + (Math.random() - 0.5) * 0.0002).toFixed(6)
      }
    : undefined;

  const sensors = {};
  if (cfg.sensors.hasTemperature)        sensors.temperature        = +temperatureVal.toFixed(2);
  if (cfg.sensors.hasHumidity)           sensors.humidity           = +humidityVal.toFixed(2);
  if (cfg.sensors.hasDust)               sensors.dust_level         = +dustVal.toFixed(2);
  if (cfg.sensors.hasVibration)          sensors.vibration          = +vibrationVal.toFixed(3);
  if (cfg.sensors.hasEnergyProduction)   sensors.power_output       = +powerOutputVal.toFixed(2);
  if (cfg.sensors.hasMicrofractureRisk)  sensors.micro_fracture_risk= +microFractureRiskVal.toFixed(2);
  if (cfg.sensors.hasLocation && simulatedLocation)
                                         sensors.location           = simulatedLocation;

  return {
    timestamp: now,
    state: runtimeState.getState(),
    params: runtimeState.getParamsForTick(cfg.intervalMs),
    ...sensors
  };
}

module.exports = { generateSensorData };
