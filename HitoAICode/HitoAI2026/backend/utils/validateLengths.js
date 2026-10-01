function validateLengths(values, limits) {
  for (const [key, max] of Object.entries(limits)) {
    const val = values[key];
    if (typeof val === 'string' && val.length > max) {
      return `${key} excede el máximo de ${max} caracteres`;
    }
  }
  return null;
}

module.exports = { validateLengths };
