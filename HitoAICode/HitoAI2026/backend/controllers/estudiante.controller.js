const EstudianteService = require('../services/estudiante.service');
const csv = require('csv-parser');
const fs = require('fs');
const { cleanRut, validarRut } = require('../utils/rut');

exports.getAll = async (req, res) => {
  const data = await EstudianteService.getAll();
  res.json(data);
};

exports.getNoInscritos = async (req, res) => {
  const data = await EstudianteService.getNoInscritos();
  res.json(data);
};

exports.getDisponiblesPorAsignatura = async (req, res) => {
  const anio = req.query.anio ? parseInt(req.query.anio, 10) : null;
  const data = await EstudianteService.getDisponiblesPorAsignatura(req.params.id, anio);
  res.json(data);
};

exports.crear = async (req, res) => {
  try {
    const est = { ...req.body, ID_Estudiante: cleanRut(req.body.ID_Estudiante) };
    const existe = await EstudianteService.existe(est.ID_Estudiante);
    if (existe) {
      return res.status(400).json({ message: 'Estudiante inscrito' });
    }
    await EstudianteService.crear(est);
    res.status(201).json({ message: 'Estudiante creado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Estudiante inscrito' });
    }
    console.error('Error al crear estudiante:', error);
    res.status(500).json({ message: 'Error al crear estudiante' });
  }
};

exports.actualizar = async (req, res) => {
  const id = cleanRut(req.params.id);
  await EstudianteService.actualizar(id, req.body);
  res.json({ message: 'Estudiante actualizado' });
};

exports.eliminar = async (req, res) => {
  try {
    await EstudianteService.eliminar(req.params.id);
    res.json({ message: 'Estudiante eliminado' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'Estudiante inscrito' });
    }
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ message: 'Error al eliminar estudiante' });
  }
};

exports.cargarCSV = async (req, res) => {
  const archivo = req.file;
  if (!archivo) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }

  const estudiantes = [];
  let rechazados = 0;
  let filasLeidas = 0;
  const detalleRechazados = [];

  const primeraLinea = fs.readFileSync(archivo.path, 'utf8').split('\n')[0];
  const separador = primeraLinea.includes(';') && !primeraLinea.includes(',') ? ';' : ',';
  console.log('[EstudianteController] 📄 Separador CSV detectado:', separador);

  fs.createReadStream(archivo.path)
    .pipe(csv({
      separator: separador,
      mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim()
    }))
    .on('headers', (headers) => {
      console.log('[EstudianteController] 📋 Encabezados leídos:', headers);
    })
    .on('data', (row) => {
      filasLeidas++;
      const filaEnArchivo = filasLeidas + 1; // +1 por la fila de encabezados
      const rutOriginal = row?.ID_Estudiante?.toString().trim() || '';
      const rut = cleanRut(rutOriginal);
      const nombre = row?.Nombre?.trim();
      const apellido = row?.Apellido?.trim();
      const anio = parseInt(row?.Anio_Ingreso, 10);

      if (!rut || !nombre || !apellido || isNaN(anio)) {
        rechazados++;
        detalleRechazados.push({
          fila: filaEnArchivo,
          rut: rutOriginal,
          motivo: 'faltan datos o el año de ingreso no es un número'
        });
        return;
      }

      if (!validarRut(rut)) {
        rechazados++;
        detalleRechazados.push({
          fila: filaEnArchivo,
          rut: rutOriginal,
          motivo: 'RUT inválido (dígito verificador incorrecto)'
        });
        return;
      }

      estudiantes.push({
        ID_Estudiante: rut,
        Nombre: nombre,
        Apellido: apellido,
        Anio_Ingreso: anio
      });
    })
    .on('end', async () => {
      try {
        const existentes = await EstudianteService.getAll();
        const mapaExistentes = new Map(
          (existentes || []).map(e => [String(e.ID_Estudiante), e])
        );

        let nuevos = 0, actualizados = 0, sinCambios = 0;
        const detalleActualizados = [];

        for (const est of estudiantes) {
          const previo = mapaExistentes.get(String(est.ID_Estudiante));
          if (!previo) {
            await EstudianteService.crear(est);
            nuevos++;
          } else {
            const igual =
              String(previo.Nombre ?? '').trim() === est.Nombre &&
              String(previo.Apellido ?? '').trim() === est.Apellido &&
              Number(previo.Anio_Ingreso) === est.Anio_Ingreso;
            if (igual) {
              sinCambios++;
            } else {
              await EstudianteService.actualizar(est.ID_Estudiante, est);
              actualizados++;
              detalleActualizados.push({
                rut: est.ID_Estudiante,
                antes: `${previo.Nombre} ${previo.Apellido} (${previo.Anio_Ingreso})`,
                despues: `${est.Nombre} ${est.Apellido} (${est.Anio_Ingreso})` 
              });
            }
          }
          mapaExistentes.set(String(est.ID_Estudiante), est);
        }

        console.log('[EstudianteController] ✅ Fin de lectura. Filas leídas:', filasLeidas,
          '| válidas:', estudiantes.length, '| rechazadas:', rechazados,
          '| nuevos:', nuevos, '| actualizados:', actualizados, '| sin cambios:', sinCambios);

        const visibles = detalleRechazados.slice(0, 10);
        const restantes = detalleRechazados.length - visibles.length;
        const resumenRechazos = detalleRechazados.length
          ? ' — ' + visibles.map(d => `fila ${d.fila}${d.rut ? ` (${d.rut})` : ''}: ${d.motivo}`).join('; ')
            + (restantes > 0 ? ` y ${restantes} más` : '')
          : '';

        const yaCargado = estudiantes.length > 0 && nuevos === 0 && actualizados === 0;
        const partes = [];
        if (nuevos) partes.push(`${nuevos} nuevos`);
        if (actualizados) partes.push(`${actualizados} actualizados`);
        if (sinCambios) partes.push(`${sinCambios} sin cambios`);

        let message = yaCargado
          ? `Este archivo ya fue cargado: los ${sinCambios} estudiantes ya existen con los mismos datos. No se modificó nada.` 
          : (partes.join(', ') || 'No se procesó ningún estudiante');
        if (rechazados) {
          message += `. ${rechazados} rechazados${resumenRechazos}`;
        }

        res.status(200).json({
          message,
          agregados: nuevos + actualizados,
          nuevos,
          actualizados,
          sinCambios,
          yaCargado,
          rechazados,
          rechazadosDetalle: detalleRechazados,
          estudiantes: estudiantes
        });
      } catch (error) {
        console.error('Error al procesar CSV:', error);
        res.status(500).json({ error: 'Error al procesar el archivo CSV' });
      }
    });
};
