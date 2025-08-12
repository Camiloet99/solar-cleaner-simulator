module.exports = {
  backendBase: process.env.BACKEND_BASE || 'http://localhost:8080',
  panelId: process.env.PANEL_ID || 'PANEL-' + Math.floor(Math.random()*1000).toString().padStart(3,'0'),
  intervalMs: Number(process.env.INTERVAL_MS || 2000),
  sessionDurationMs: Number(process.env.sessionDurationMs || 10 * 60 * 1000),
  apiKey: process.env.API_KEY || '',
  // Fallback si el generador no manda location
  defaultLocation: {
    lat: process.env.LAT ? Number(process.env.LAT) : 4.6510,     // Bogotá por defecto
    lng: process.env.LNG ? Number(process.env.LNG) : -74.0836
  },
  debug: process.env.DEBUG_SIM === '1'
};
