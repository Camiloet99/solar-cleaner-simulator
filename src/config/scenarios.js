// src/config/scenarios.js

const SCENARIOS = {
  optimal_maintenance: {
    label: 'Panel nuevo o con limpieza reciente y frecuente',
    temperature: { base: 30, variance: 2 },
    humidity: { base: 45, variance: 5 },
    dust_level: { base: 5, variance: 3 },
    vibration: { base: 0.01, variance: 0.005 },
    anomalyProbability: 0.01
  },
  scheduled_maintenance: {
    label: 'Panel mantenido periódicamente (cada 2 semanas)',
    temperature: { base: 32, variance: 3 },
    humidity: { base: 50, variance: 8 },
    dust_level: { base: 15, variance: 5 },
    vibration: { base: 0.03, variance: 0.01 },
    anomalyProbability: 0.05
  },
  irregular_maintenance: {
    label: 'Panel funcional con mantenimiento poco constante',
    temperature: { base: 34, variance: 5 },
    humidity: { base: 60, variance: 10 },
    dust_level: { base: 35, variance: 15 },
    vibration: { base: 0.1, variance: 0.05 },
    anomalyProbability: 0.15
  },
  degraded_panel: {
    label: 'Panel con signos de envejecimiento y polvo acumulado',
    temperature: { base: 38, variance: 5 },
    humidity: { base: 65, variance: 12 },
    dust_level: { base: 60, variance: 20 },
    vibration: { base: 0.15, variance: 0.07 },
    anomalyProbability: 0.25
  },
  neglected_panel: {
    label: 'Panel con mantenimiento deficiente, potencialmente en falla',
    temperature: { base: 42, variance: 6 },
    humidity: { base: 75, variance: 15 },
    dust_level: { base: 85, variance: 10 },
    vibration: { base: 0.25, variance: 0.1 },
    anomalyProbability: 0.35
  }
};

module.exports = SCENARIOS;
