function construirTablaHeatmap(rows, { Table, TableRow, TableCell, Paragraph, TextRun }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  // Pivot data: students x competencies
  const students = [...new Set(rows.map(r => r.nombre_estudiante || r.estudiante || 'Estudiante'))];
  const competencies = [...new Set(rows.map(r => r.competencia))].sort();

  const matrix = {};
  students.forEach(student => {
    matrix[student] = {};
    competencies.forEach(comp => {
      matrix[student][comp] = null;
    });
  });

  rows.forEach(row => {
    const student = row.nombre_estudiante || row.estudiante || 'Estudiante';
    const comp = row.competencia;
    const logro = Number(row.logro) || 0;
    if (matrix[student] && matrix[student][comp] !== undefined) {
      matrix[student][comp] = logro;
    }
  });

  // Color thresholds (same as calcularNivel in analisis.routes.js)
  function getColorForLogro(logro) {
    const n = Number(logro);
    if (n >= 90) return '4CAF50'; // Excelente - green
    if (n >= 75) return '8BC34A'; // Alto - green-blue
    if (n >= 60) return 'FFC107'; // Medio - yellow
    return 'F44336'; // Bajo - red
  }

  function getTextColorForLogro(logro) {
    const n = Number(logro);
    if (n >= 75) return 'FFFFFF'; // White text for green backgrounds
    return '000000'; // Black text for yellow/red backgrounds
  }

  // Build table rows
  const tableRows = [];

  // Header row
  const headerCells = [
    TableCell({
      children: [Paragraph({ children: [TextRun({ text: 'Estudiante', bold: true })] })],
      shading: { fill: 'F0F0F0' },
    }),
    ...competencies.map(comp =>
      TableCell({
        children: [Paragraph({ children: [TextRun({ text: comp, bold: true })] })],
        shading: { fill: 'F0F0F0' },
      })
    ),
  ];
  tableRows.push(TableRow({ children: headerCells }));

  // Data rows
  students.forEach(student => {
    const dataCells = [
      TableCell({
        children: [Paragraph({ children: [TextRun({ text: student })] })],
        shading: { fill: 'F0F0F0' },
      }),
      ...competencies.map(comp => {
        const logro = matrix[student][comp];
        const value = logro !== null ? `${Math.round(logro)}%` : '-';
        const fillColor = logro !== null ? getColorForLogro(logro) : 'FFFFFF';
        const textColor = logro !== null ? getTextColorForLogro(logro) : '000000';

        return TableCell({
          children: [
            Paragraph({
              children: [TextRun({ text: value, color: textColor })],
              alignment: 'center',
            }),
          ],
          shading: { fill: fillColor },
          width: { size: 15, type: 'pct' },
        });
      }),
    ];
    tableRows.push(TableRow({ children: dataCells }));
  });

  return Table({
    rows: tableRows,
    width: { size: 100, type: 'pct' },
  });
}

module.exports = { construirTablaHeatmap };
