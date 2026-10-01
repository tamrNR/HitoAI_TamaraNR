function cleanRut(rut) {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
}

function validarRut(rut) {
  rut = cleanRut(rut);
  if (!/^[0-9]+[0-9K]$/.test(rut)) return false;
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    sum += parseInt(cuerpo.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expected = 11 - (sum % 11);
  let dvCalc = '';
  if (expected === 11) dvCalc = '0';
  else if (expected === 10) dvCalc = 'K';
  else dvCalc = expected.toString();
  return dvCalc === dv;
}

module.exports = { cleanRut, validarRut };
