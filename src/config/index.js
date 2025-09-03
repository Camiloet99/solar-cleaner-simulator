module.exports = {
  backendBase: process.env.BACKEND_BASE || 'http://localhost:8080',
  events: {
    stateChangePath: process.env.STATE_CHANGE_PATH || '/api/telemetry/state-change'
  },
  panelId: process.env.PANEL_ID || 'PANEL-' + Math.floor(Math.random()*1000).toString().padStart(3,'0'),
  intervalMs: Number(process.env.INTERVAL_MS || 2000),
  sessionDurationMs: Number(process.env.sessionDurationMs || 10 * 60 * 1000),
  apiKey: process.env.API_KEY || '',
  defaultLocation: {
    lat: process.env.LAT ? Number(process.env.LAT) : 4.6510,     
    lng: process.env.LNG ? Number(process.env.LNG) : -74.0836
  },
  sensors: {
    hasTemperature: (process.env.SEN_TEMP ?? '1') === '1',
    hasHumidity:    (process.env.SEN_HUM  ?? '1') === '1',
    hasDust:        (process.env.SEN_DUST ?? '1') === '1',
    hasVibration:   (process.env.SEN_VIB  ?? '1') === '1',
    hasMicrofractureRisk: (process.env.SEN_MFR ?? '1') === '1',
    hasEnergyProduction:  (process.env.SEN_PWR ?? '1') === '1',
    hasLocation:    (process.env.SEN_GPS  ?? '1') === '1',
  },
  actuators: {
    hasWaterPump: (process.env.ACT_WATER ?? '1') === '1',
    hasBrush:     (process.env.ACT_BRUSH ?? '1') === '1',
    hasVacuum:    (process.env.ACT_VAC   ?? '1') === '1',
  },

  controlServer: {
    enabled: (process.env.CTL_ENABLED ?? '1') === '1',
    port: Number(process.env.CTL_PORT ?? 7070),
    apiKey: process.env.CTL_API_KEY || ''
  },

  cleaningMode: (process.env.CLEANING_MODE || 'REGULAR').toUpperCase(), // LIGHT | REGULAR | RIGOROUS
  debug: process.env.DEBUG_SIM === '1'
};
