// utils/sin-datos-flags.ts
// Flags de "sin datos" (evaluados = 0) para los puntos de los gráficos de líneas.
// La clave es 'competencia|periodoId': para evolución el periodoId es evaluacionId
// (a prueba de nombres de evaluación duplicados, p. ej. varios "print").

export type FlagsSinDatos = Set<string>;

export function recolectarFlagsSinDatos(
  items: any[],
  competenciaDe: (d: any) => string,
  periodoDe: (d: any) => any
): FlagsSinDatos {
  const flags: FlagsSinDatos = new Set();
  (items || []).forEach(d => {
    if (Number(d?.evaluados) === 0) {
      flags.add(`${String(competenciaDe(d)).trim()}|${periodoDe(d)}`);
    }
  });
  return flags;
}

// values[i] corresponde a ids[i] (mismo orden que las labels del chart).
// Si la clave está en flags, el valor se envía como null ("No disponible").
export function aplicarFlagsSinDatos(
  values: any[],
  ids: any[],
  competencia: string,
  flags: FlagsSinDatos
): any[] {
  return (values || []).map((v, i) =>
    flags.has(`${String(competencia).trim()}|${ids[i]}`) ? null : v
  );
}
