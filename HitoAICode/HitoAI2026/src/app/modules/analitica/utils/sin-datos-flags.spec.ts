import { recolectarFlagsSinDatos, aplicarFlagsSinDatos } from './sin-datos-flags';

describe('sinDatos flags (análisis IA líneas/evolución)', () => {
  // Caso 1 — evolución con nombres de evaluación duplicados ("print" ×3):
  // la clave debe distinguir por evaluacionId, no por nombre
  const items = [
    { competencia: 'CP2 · X', evaluacionId: 6, evaluacionNombre: 'print', evaluados: 0, logro: 0 },
    { competencia: 'CP2 · X', evaluacionId: 7, evaluacionNombre: 'print', evaluados: 3, logro: 80 },
    { competencia: 'CP2 · X', evaluacionId: 8, evaluacionNombre: 'print', evaluados: 0, logro: 0 },
    { competencia: 'CS · Y',  evaluacionId: 6, evaluacionNombre: 'print', evaluados: 2, logro: 70 }
  ];
  const flags = recolectarFlagsSinDatos(items, d => d.competencia, d => d.evaluacionId);

  it('marca solo los puntos con evaluados = 0, por evaluacionId', () => {
    expect(flags.has('CP2 · X|6')).toBeTrue();
    expect(flags.has('CP2 · X|7')).toBeFalse();
    expect(flags.has('CP2 · X|8')).toBeTrue();
    expect(flags.has('CS · Y|6')).toBeFalse();
  });

  it('aplicarFlagsSinDatos convierte a null solo los índices flaggeados', () => {
    // values alineados a evalIds [6,7,8] del dataset CP2
    const out = aplicarFlagsSinDatos([0, 80, 0], [6, 7, 8], 'CP2 · X', flags);
    expect(out).toEqual([null, 80, null]);
  });

  it('no marca nada cuando todos tienen evaluados > 0', () => {
    const ok = recolectarFlagsSinDatos(
      [{ competencia: 'CD1', evaluacionId: 1, evaluados: 5, logro: 90 }],
      d => d.competencia, d => d.evaluacionId);
    expect(ok.size).toBe(0);
    expect(aplicarFlagsSinDatos([90], [1], 'CD1', ok)).toEqual([90]);
  });

  it('tolera items vacíos o sin campo evaluados', () => {
    expect(recolectarFlagsSinDatos([], d => d.competencia, d => d.evaluacionId).size).toBe(0);
    expect(recolectarFlagsSinDatos(null as any, d => d.competencia, d => d.evaluacionId).size).toBe(0);
    // evaluados undefined => Number(undefined)=NaN !== 0 => no flag (backend antiguo)
    expect(recolectarFlagsSinDatos(
      [{ competencia: 'CD1', evaluacionId: 1, logro: 0 }],
      d => d.competencia, d => d.evaluacionId).size).toBe(0);
  });
});
