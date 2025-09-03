function paramsForMode(mode) {
  switch (String(mode || 'REGULAR').toUpperCase()) {
    case 'LIGHT':
      return {
        robotSpeed: 0.6,   brushRpm: 500,  waterPressure: 1.0, detergentFlowRate: 0.1,
        vacuumPower: 0.4,  turnRadius: 0.8, passOverlap: 15,   pathSpacing: 0.8,
        squeegeePressure: 20, dwellTime: 0, rpmRampRate: 100,  maxWaterPerMin: 0.6, maxEnergyPerMin: 40
      };
    case 'RIGOROUS':
      return {
        robotSpeed: 0.3,   brushRpm: 900,  waterPressure: 3.5, detergentFlowRate: 0.5,
        vacuumPower: 0.8,  turnRadius: 0.5, passOverlap: 40,   pathSpacing: 0.4,
        squeegeePressure: 60, dwellTime: 10, rpmRampRate: 100, maxWaterPerMin: 1.6, maxEnergyPerMin: 80
      };
    case 'REGULAR':
    default:
      return {
        robotSpeed: 0.45,  brushRpm: 700,  waterPressure: 2.0, detergentFlowRate: 0.3,
        vacuumPower: 0.6,  turnRadius: 0.6, passOverlap: 25,   pathSpacing: 0.6,
        squeegeePressure: 40, dwellTime: 5, rpmRampRate: 100,  maxWaterPerMin: 1.0, maxEnergyPerMin: 60
      };
  }
}

module.exports = { paramsForMode };
