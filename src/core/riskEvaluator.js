function evaluateRisk(temp, vib, output, dust) {
  let risk = 0;
  if (temp > 38) risk += 0.3;
  if (vib > 0.3) risk += 0.2;
  if (output < 160) risk += 0.3;
  if (dust > 80) risk += 0.2;
  return +Math.min(risk, 1.0).toFixed(2);
}

module.exports = { evaluateRisk };
