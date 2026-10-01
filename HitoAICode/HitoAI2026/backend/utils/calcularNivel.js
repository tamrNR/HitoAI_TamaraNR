function calcularNivel(pct) {
  const n = Number(pct);
  if (n >= 90) return 'Excelente';
  if (n >= 75) return 'Alto';
  if (n >= 60) return 'Medio';
  return 'Bajo';
}

module.exports = calcularNivel;
