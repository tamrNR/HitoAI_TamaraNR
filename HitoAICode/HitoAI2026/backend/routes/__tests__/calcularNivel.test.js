const assert = require('assert');
const calcularNivel = require('../../utils/calcularNivel');

// Casos de prueba para PU-03: Clasificar los resultados según los umbrales o niveles de riesgo definidos

assert.strictEqual(calcularNivel(95), 'Excelente');
assert.strictEqual(calcularNivel(90), 'Excelente');
assert.strictEqual(calcularNivel(89.9), 'Alto');
assert.strictEqual(calcularNivel(75), 'Alto');
assert.strictEqual(calcularNivel(74.9), 'Medio');
assert.strictEqual(calcularNivel(60), 'Medio');
assert.strictEqual(calcularNivel(59.9), 'Bajo');
assert.strictEqual(calcularNivel(0), 'Bajo');

console.log('PU-03 APROBADA: todos los niveles y valores límite fueron clasificados correctamente.');
