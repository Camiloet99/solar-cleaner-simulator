// src/config/index.js

module.exports = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8080/api/readings',
  panelId: 'PANEL-001',
  location: { lat: 6.25184, lng: -75.56359 },
  intervalMs: 2000, // 2 segundos
  sessionDurationMs: 10 * 60 * 1000 // 10 minutos
};
