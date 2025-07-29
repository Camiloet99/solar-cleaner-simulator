// const axios = require('axios'); // Desactivado mientras no hay backend

const { log } = require('../utils/logger');
const { backendUrl } = require('../config');

async function sendData(data) {
  log(`Simulando envío de datos al backend (${backendUrl})`);
  console.table(data); // Muestra los datos en formato de tabla en consola

  // MOCK: esperar 200 ms para simular latencia de red
  await new Promise((resolve) => setTimeout(resolve, 200));

  // En producción usar esto:
  // try {
  //   const res = await axios.post(backendUrl, data, {
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  //   log(`Data sent ✔ [${res.status}]`);
  // } catch (err) {
  //   error(`Failed to send data: ${err.message}`);
  // }
}

module.exports = { sendData };
