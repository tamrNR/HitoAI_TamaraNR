let ChartJSNodeCanvas;
try {
  ({ ChartJSNodeCanvas } = require('chartjs-node-canvas'));
} catch (err) {
  console.warn(
    'chartjs-node-canvas module not found. Run "npm install" in the backend directory to enable chart generation.'
  );
}

const fs = require('fs');
const path = require('path');
let ChartDataLabels;
try {
  ChartDataLabels = require('chartjs-plugin-datalabels');
} catch {
  ChartDataLabels = null;
}

const width = 600;
const height = 333;
const chartCallback = ChartJS => {
  if (ChartDataLabels) {
    ChartJS.register(ChartDataLabels);
  }
};

const chartJSNodeCanvas = ChartJSNodeCanvas
  ? new ChartJSNodeCanvas({ width, height, chartCallback })
  : null;

function ensureDir() {
  const dir = path.join(__dirname, '..', 'public', 'img');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function generarGraficoBarras(labels, datos, nombreArchivo = 'grafico.png', titulo = 'Gráfico de Barras') {
  if (!chartJSNodeCanvas) return null;

  const colorMap = {
    Excelente: 'rgba(75, 192, 192, 0.8)',
    Aceptable: 'rgba(255, 205, 86, 0.8)',
    Insuficiente: 'rgba(255, 99, 132, 0.8)',
  };
  const defaultColors = [
    colorMap.Excelente,
    colorMap.Aceptable,
    colorMap.Insuficiente,
    'rgba(0,123,255,0.8)',
  ];

  const wrappedLabels = labels.map(l => l.match(/.{1,15}/g)?.join('\n') || l);
  let datasets = [];

  if (Array.isArray(datos) && typeof datos[0] === 'number') {
    datasets.push({
      label: 'Alumnos sobre promedio (%)',
      data: datos.map(d => Number(d) || 0),
      backgroundColor: defaultColors[3],
      maxBarThickness: 40,
      barPercentage: 0.5,
    });
  }

  const config = {
    type: 'bar',
    data: {
      labels: wrappedLabels,
      datasets,
    },
    options: {
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: titulo,
          font: { size: 16 },
        },
        legend: { display: datasets.length > 1 },
        datalabels: {
          color: '#ffffff',
          anchor: 'center',
          align: 'center',
          formatter: v => `${v}%`,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 10 },
          title: { display: true, text: '% de Alumnos' },
        },
        y: {
          title: { display: true, text: 'Indicadores' },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const filePath = path.join(ensureDir(), nombreArchivo);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}


async function generarGraficoTorta(
  labels,
  datos,
  nombreArchivo = 'torta.png',
  titulo = ''
) {
  if (!chartJSNodeCanvas) return null;
  const colors = [
    'rgba(33, 150, 243, 0.7)',
    'rgba(76, 175, 80, 0.7)',
    'rgba(255, 193, 7, 0.7)',
    'rgba(244, 67, 54, 0.7)',
    'rgba(156, 39, 176, 0.7)',
    'rgba(158, 158, 158, 0.7)',
  ];
  const config = {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data: datos,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),

        },
      ],
    },
    options: {
      plugins: {

        title: { display: !!titulo, text: titulo },

        datalabels: {
          color: '#000000',
          formatter: (val, ctx) => {
            const data = ctx.chart.data.datasets[0].data || [];
            const sum = data.reduce((acc, d) => acc + Number(d || 0), 0);
            const pct = sum ? (val / sum) * 100 : 0;
            return `${pct % 1 ? pct.toFixed(1) : pct}%`;
          },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const filePath = path.join(ensureDir(), nombreArchivo);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function generarGraficoLineas(labels, datos, nombreArchivo = 'lineas.png', titulo = 'Gráfico de Cumplimiento') {
  if (!chartJSNodeCanvas) return null;

  datos = datos.map(d => Number(d) || 0);
  const wrappedLabels = labels.map(l => l.match(/.{1,15}/g)?.join('\n') || l);

  const config = {
    type: 'bar',
    data: {
      labels: wrappedLabels,
      datasets: [
        {
          label: 'Cumplimiento (%)',
          data: datos,
          backgroundColor: 'rgba(0,123,255,0.8)',
        },
      ],
    },
    options: {
      indexAxis: 'x',
      plugins: {
        title: {
          display: true,
          text: titulo,
          font: { size: 16 },
        },
        legend: { display: false },
        datalabels: {
          color: '#ffffff',
          anchor: 'center',
          align: 'center',
          formatter: v => `${v}%`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 10 },
          title: { display: true, text: 'Cumplimiento (%)' },
        },
        x: { title: { display: true, text: 'Competencias' } },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const filePath = path.join(ensureDir(), nombreArchivo);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function generarGraficoRadar(labels, datos, nombreArchivo = 'radar.png', titulo = 'Gráfico Radar', umbral = 51) {
  if (!chartJSNodeCanvas) return null;

  const shortLabels = labels.map(l => String(l).split('·')[0].trim());

  const umbralOctagonoPlugin = {
    id: 'umbralRadarLine',
    afterDraw: (chart) => {
      const scale = chart.scales.r;
      if (!scale) return;
      const ctx = chart.ctx;
      const centerX = scale.xCenter;
      const centerY = scale.yCenter;
      const radius = scale.getDistanceFromCenterForValue(umbral);
      const numPoints = scale.getLabels().length;

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(229, 57, 53, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    }
  };

  const chartJSNodeCanvasHD = new ChartJSNodeCanvas({ width: 700, height: 450, chartCallback });

  const config = {
    type: 'radar',
    data: {
      labels: shortLabels,
      datasets: [
        {
          label: 'Logro (%)',
          data: datos.map(d => Number(d) || 0),
          backgroundColor: 'rgba(10, 61, 145, 0.2)',
          borderColor: '#0A3D91',
          borderWidth: 2,
          pointBackgroundColor: '#0A3D91',
          pointBorderColor: '#fff',
          pointRadius: 4,
        },
        {
          label: `Umbral (${umbral}%)`,
          data: shortLabels.map(() => null),
          borderColor: 'rgba(229, 57, 53, 0.6)',
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ],
    },
    plugins: [umbralOctagonoPlugin],
    options: {
      layout: {
        padding: 4
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 'bold' },
            color: '#1a1a1a',
            filter: (legendItem) => legendItem.text.includes('Umbral')
          }
        },
        datalabels: {
          color: '#1a1a1a',
          font: { size: 16, weight: 'bold' },
          anchor: 'end',
          align: 'end',
          offset: 4,
          formatter: v => `${v}%`,
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          pointLabels: {
            font: { size: 13, weight: 'bold' },
            color: '#1a1a1a'
          },
          ticks: {
            stepSize: 20,
            font: { size: 11, weight: 'bold' },
            color: '#333333',
            backdropColor: 'rgba(255,255,255,0.8)'
          },
          grid: { color: 'rgba(0,0,0,0.1)' },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvasHD.renderToBuffer(config);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generarGraficoBurbujas(items, nombreArchivo = 'burbujas.png', titulo = 'Competencias vs Brecha', umbral = 51) {
  if (!chartJSNodeCanvas) return null;

  const pesos = items.map(item => Number(item.r) || 1);
  const minR = 8, maxR = 28;
  const minVal = Math.min(...pesos);
  const maxVal = Math.max(...pesos);

  const escalarR = (valor) => {
    if (minVal === maxVal) return (minR + maxR) / 2;
    const areaMin = minR * minR;
    const areaMax = maxR * maxR;
    const areaInterpolada = areaMin + ((valor - minVal) / (maxVal - minVal)) * (areaMax - areaMin);
    return Math.sqrt(areaInterpolada);
  };

  const paletaCompetencias = {
    CD1: '#1E88E5', CD2: '#43A047', CD3: '#FB8C00', CG1: '#8E24AA',
    CG2: '#00ACC1', CP1: '#D81B60', CP2: '#FDD835', CS: '#6D4C41'
  };
  const colorPorCompetencia = (competenciaTexto) => {
    const codigo = String(competenciaTexto || '').split('·')[0].trim();
    return paletaCompetencias[codigo] || '#999999';
  };

  const datasets = items.map((item, i) => ({
    label: (() => {
      const codigo = String(item.competencia || '').split('·')[0].trim() || `Competencia ${i + 1}`;
      const cantidadIndicadores = Math.round(Number(item.r) || 0);
      return `${codigo} = ${cantidadIndicadores} ind.`;
    })(),
    data: [{ x: Number(item.x) || 0, y: Number(item.y) || 0, r: escalarR(Number(item.r) || 1) }],
    backgroundColor: colorPorCompetencia(item.competencia) + '55',
    borderColor: colorPorCompetencia(item.competencia),
    borderWidth: 2,
  }));

  // Dataset adicional para línea de umbral (y=0)
  const umbralLineDataset = {
    type: 'line',
    label: `Umbral (${umbral}%)`,
    data: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    borderColor: '#9e9e9e',
    borderDash: [5, 5],
    pointRadius: 0,
    showLine: true,
    fill: false,
    borderWidth: 2
  };

  datasets.push(umbralLineDataset);

  const chartJSNodeCanvasHD = new ChartJSNodeCanvas({ width: 700, height: 450, chartCallback });

  // Escalado dinámico de ejes: hace zoom al rango real de los datos en vez
  // de usar una escala fija 0-100, para que las diferencias entre
  // competencias sean visibles en vez de quedar comprimidas en una esquina.
  const logrosX = items.map(item => Number(item.x) || 0);
  const minX = Math.min(...logrosX);
  const maxX = Math.max(...logrosX);
  const paddingX = Math.max(5, Math.abs(maxX - minX) * 0.15);
  const xMin = Math.max(0, minX - paddingX);
  const xMax = Math.min(100, maxX + paddingX);

  const distanciasY = items.map(item => Number(item.y) || 0);
  const minY = Math.min(...distanciasY);
  const maxY = Math.max(...distanciasY);
  const paddingY = Math.max(10, Math.abs(maxY - minY) * 0.15);
  const yMin = minY - paddingY;
  const yMax = maxY + paddingY;

  // Detectar competencias que comparten exactamente la misma posición
  // (mismo x, mismo y) para mostrarles una etiqueta de código corto,
  // ya que en el PDF no hay tooltip al pasar el mouse.
  const posicionesVistas = new Map();
  items.forEach((item, i) => {
    const key = `${Number(item.x) || 0},${Number(item.y) || 0}`;
    if (!posicionesVistas.has(key)) posicionesVistas.set(key, []);
    posicionesVistas.get(key).push(i);
  });

  const config = {
    type: 'bubble',
    data: { datasets },
    options: {
      layout: {
        padding: 4
      },
      plugins: {
        title: {
          display: false
        },
        legend: { 
          display: true, 
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
        datalabels: {
          display: (context) => {
            const item = items[context.datasetIndex];
            if (!item) return false;
            const key = `${Number(item.x) || 0},${Number(item.y) || 0}`;
            const grupo = posicionesVistas.get(key) || [];
            return grupo.length > 1;
          },
          color: '#1a1a1a',
          font: { size: 11, weight: 'bold' },
          anchor: 'center',
          align: (context) => {
            const item = items[context.datasetIndex];
            if (!item) return 'top';
            const key = `${Number(item.x) || 0},${Number(item.y) || 0}`;
            const grupo = posicionesVistas.get(key) || [];
            const posicionEnGrupo = grupo.indexOf(context.datasetIndex);
            return posicionEnGrupo % 2 === 0 ? 'top' : 'bottom';
          },
          offset: (context) => {
            const item = items[context.datasetIndex];
            if (!item) return 6;
            const key = `${Number(item.x) || 0},${Number(item.y) || 0}`;
            const grupo = posicionesVistas.get(key) || [];
            const posicionEnGrupo = grupo.indexOf(context.datasetIndex);
            return 4 + Math.floor(posicionEnGrupo / 2) * 12;
          },
          formatter: (value, context) => {
            const item = items[context.datasetIndex];
            if (!item) return '';
            return String(item.competencia || '').split('·')[0].trim();
          }
        },
      },
      scales: {
        x: {
          min: xMin,
          max: xMax,
          title: { display: true, text: 'Porcentaje de Logro (%)', font: { size: 14, weight: 'bold' }, color: '#1a1a1a' },
          ticks: {
            font: { size: 13, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
        y: {
          min: yMin,
          max: yMax,
          title: { display: true, text: 'Distancia al Umbral (%)', font: { size: 14, weight: 'bold' }, color: '#1a1a1a' },
          ticks: {
            font: { size: 13, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvasHD.renderToBuffer(config);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generarGraficoBarrasComparativa(labels, series, nombreArchivo = 'barras-comparativa.png', titulo = 'Comparativa') {
  if (!chartJSNodeCanvas) return null;

  const shortLabels = labels.map(l => String(l).split('·')[0].trim());

  const colorPorSerie = (nombre) => {
    if (nombre === 'Promedio General') return '#1B3B6F';
    if (nombre === 'Alumno') return '#5BC8E8';
    if (nombre === '% Alumnos que cumplen umbral') return '#1B3B6F';
    return '#9e9e9e';
  };

  const datasets = series.map((s, i) => {
    const color = colorPorSerie(s.name);
    return {
      label: s.name || `Serie ${i + 1}`,
      data: (s.values || []).map(v => Number(v) || 0),
      backgroundColor: color,
      borderRadius: 4,
      barPercentage: 0.75,
      categoryPercentage: 0.8,
    };
  });

  // chartCallback vacío específicamente para este gráfico, para evitar el
  // bug conocido de chartjs-plugin-datalabels con gráficos tipo 'bar' en
  // este entorno (Node v22 + versiones instaladas).
  const chartJSNodeCanvasHD = new ChartJSNodeCanvas({ width: 1000, height: 650, chartCallback: () => {} });

  const etiquetasManualPlugin = {
    id: 'etiquetasManual',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (!chart.isDatasetVisible(datasetIndex)) return;
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index];
          if (value === null || value === undefined) return;
          const text = `${value}%`;
          ctx.fillText(text, bar.x, bar.y - 6);
        });
      });
      ctx.restore();
    }
  };

  const config = {
    type: 'bar',
    data: {
      labels: shortLabels,
      datasets,
    },
    plugins: [etiquetasManualPlugin],
    options: {
      layout: {
        padding: { top: 30, left: 4, right: 4, bottom: 4 }
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 'bold' },
            color: '#1B3B6F'
          }
        },
        datalabels: {
          display: false
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Competencia',
            font: { size: 13, weight: 'bold' },
            color: '#1B3B6F'
          }
        },
        y: {
          beginAtZero: true,
          max: 115,
          title: { display: true, text: 'Logro (%)', font: { size: 13, weight: 'bold' }, color: '#1B3B6F' },
          ticks: {
            stepSize: 10,
            callback: (v) => (Number(v) > 100 ? '' : v + '%'),
            font: { size: 12, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvasHD.renderToBuffer(config);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generarGraficoTrayectoria(data, nombreArchivo = 'trayectoria.png', titulo = 'Trayectoria Académica') {
  if (!chartJSNodeCanvas) return null;

  const grouped = {};
  data.forEach(d => {
    if (!grouped[d.competencia]) {
      grouped[d.competencia] = [];
    }
    grouped[d.competencia].push({
      x: d.semestre,
      y: Number(d.logro) || 0,
    });
  });

  const competencias = Object.keys(grouped);
  const semestres = [...new Set(data.map(d => d.semestre))].sort((a, b) => {
    const aNum = parseInt(String(a).replace(/\D/g, '')) || 0;
    const bNum = parseInt(String(b).replace(/\D/g, '')) || 0;
    return aNum - bNum;
  });

  const colors = [
    'rgba(75, 192, 192, 1)',
    'rgba(255, 205, 86, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
  ];

  const datasets = competencias.map((comp, i) => ({
    label: comp.split('·')[0].trim(),
    data: grouped[comp],
    borderColor: colors[i % colors.length],
    backgroundColor: colors[i % colors.length].replace('1)', '0.2)'),
    tension: 0.3,
    fill: false,
    pointRadius: 6,
    pointHoverRadius: 8,
  }));

  // Detectar puntos que comparten (x, y) exacto entre competencias
  const posicionesVistas = new Map(); // key: "x,y" -> array de índices de dataset que están ahí
  competencias.forEach((comp, i) => {
    grouped[comp].forEach(punto => {
      const key = `${punto.x},${punto.y}`;
      if (!posicionesVistas.has(key)) posicionesVistas.set(key, []);
      posicionesVistas.get(key).push(i);
    });
  });

  const semestreMaximo = Math.max(...semestres);
  const semestreMinimo = Math.min(...semestres);

  const chartJSNodeCanvasHD = new ChartJSNodeCanvas({ width: 700, height: 450, chartCallback });

  const config = {
    type: 'line',
    data: {
      labels: semestres,
      datasets,
    },
    options: {
      layout: {
        padding: 4
      },
      plugins: {
        title: {
          display: false
        },
        legend: { 
          display: true, 
          position: 'bottom',
          labels: {
            font: { size: 12, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
        datalabels: {
          display: (context) => {
            const punto = context.dataset.data[context.dataIndex];
            if (!punto) return false;
            const key = `${punto.x},${punto.y}`;
            const grupo = posicionesVistas.get(key) || [];
            return grupo.length > 1;
          },
          color: '#1a1a1a',
          font: { size: 12, weight: 'bold' },
          align: (context) => {
            const punto = context.dataset.data[context.dataIndex];
            if (!punto) return 'top';
            const key = `${punto.x},${punto.y}`;
            const grupo = posicionesVistas.get(key) || [];
            const posicionEnGrupo = grupo.indexOf(context.datasetIndex);
            return posicionEnGrupo % 2 === 0 ? 'top' : 'bottom';
          },
          offset: (context) => {
            const punto = context.dataset.data[context.dataIndex];
            if (!punto) return 6;
            const key = `${punto.x},${punto.y}`;
            const grupo = posicionesVistas.get(key) || [];
            const posicionEnGrupo = grupo.indexOf(context.datasetIndex);
            return 6 + Math.floor(posicionEnGrupo / 2) * 10;
          },
          formatter: (value, context) => context.dataset.label || ''
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Semestre' },
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Logro (%)' },
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#1a1a1a'
          }
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvasHD.renderToBuffer(config);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generarGraficoEvolucion(items, nombreArchivo = 'evolucion.png', titulo = 'Evolución por Evaluación') {
  if (!chartJSNodeCanvas) return null;

  const data = Array.isArray(items) ? items : [];
  if (!data.length) return null;

  const evaluacionesOrdenadas = [...new Map(
    data.map(d => [d.evaluacionId, { id: d.evaluacionId, nombre: d.evaluacionNombre, orden: Number(d.orden) }])
  ).values()].sort((a, b) => a.orden - b.orden);

  const labels = evaluacionesOrdenadas.map(e => e.nombre);
  const competencias = [...new Set(data.map(d => String(d.competencia).trim()))].sort();

  const logroMap = new Map();
  data.forEach(d => {
    const key = `${String(d.competencia).trim()}|${d.evaluacionId}`;
    logroMap.set(key, parseFloat(d.logro));
  });

  const paletaCompetencias = {
    CD1: '#1E88E5', CD2: '#43A047', CD3: '#FB8C00', CG1: '#8E24AA',
    CG2: '#00ACC1', CP1: '#D81B60', CP2: '#FDD835', CS: '#6D4C41'
  };
  const colorPorCompetencia = (competenciaTexto) => {
    const codigo = String(competenciaTexto).split('·')[0].trim();
    return paletaCompetencias[codigo] || '#999999';
  };

  const datasets = competencias.map(competencia => {
    const color = colorPorCompetencia(competencia);
    return {
      label: competencia.split('·')[0].trim(),
      data: evaluacionesOrdenadas.map(e => {
        const key = `${competencia}|${e.id}`;
        const val = logroMap.get(key);
        return val !== undefined ? val : null;
      }),
      borderColor: color,
      backgroundColor: color,
      pointBackgroundColor: color + '55',
      pointBorderColor: color,
      pointBorderWidth: 2,
      borderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0,
      fill: false,
      spanGaps: false
    };
  });

  // Detectar competencias que comparten exactamente el mismo punto (misma
  // evaluación e igual valor de logro) para mostrar etiqueta solo ahí.
  const posicionesVistas = new Map();
  datasets.forEach((ds, dsIndex) => {
    ds.data.forEach((val, idx) => {
      if (val === null || val === undefined) return;
      const key = `${idx},${val}`;
      if (!posicionesVistas.has(key)) posicionesVistas.set(key, []);
      posicionesVistas.get(key).push(dsIndex);
    });
  });

  const chartJSNodeCanvasHD = new ChartJSNodeCanvas({ width: 700, height: 450, chartCallback });

  const config = {
    type: 'line',
    data: { labels, datasets },
    options: {
      layout: { padding: 4 },
      plugins: {
        title: { display: false },
        legend: {
          display: true,
          position: 'bottom',
          labels: { font: { size: 11, weight: 'bold' }, color: '#1a1a1a' }
        },
        datalabels: {
          display: (context) => {
            const val = context.dataset.data[context.dataIndex];
            if (val === null || val === undefined) return false;
            const key = `${context.dataIndex},${val}`;
            const grupo = posicionesVistas.get(key) || [];
            return grupo.length > 1;
          },
          color: '#1a1a1a',
          font: { size: 10, weight: 'bold' },
          align: (context) => {
            const val = context.dataset.data[context.dataIndex];
            const key = `${context.dataIndex},${val}`;
            const grupo = posicionesVistas.get(key) || [];
            const posicionEnGrupo = grupo.indexOf(context.datasetIndex);
            return posicionEnGrupo % 2 === 0 ? 'top' : 'bottom';
          },
          offset: (context) => {
            const val = context.dataset.data[context.dataIndex];
            const key = `${context.dataIndex},${val}`;
            const grupo = posicionesVistas.get(key) || [];
            const posicionEnGrupo = grupo.indexOf(context.datasetIndex);
            return 4 + Math.floor(posicionEnGrupo / 2) * 10;
          },
          formatter: (value, context) => context.dataset.label || ''
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Evaluación', font: { size: 12, weight: 'bold' }, color: '#1a1a1a' },
          ticks: { font: { size: 9 }, color: '#333333' }
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Logro (%)', font: { size: 12, weight: 'bold' }, color: '#1a1a1a' },
          ticks: { font: { size: 10 }, color: '#333333' },
          grid: { color: 'rgba(0,0,0,0.1)' },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvasHD.renderToBuffer(config);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

module.exports = {
  generarGraficoBarras,
  generarGraficoTorta,
  generarGraficoLineas,
  generarGraficoRadar,
  generarGraficoBurbujas,
  generarGraficoBarrasComparativa,
  generarGraficoTrayectoria,
  generarGraficoEvolucion,
};
