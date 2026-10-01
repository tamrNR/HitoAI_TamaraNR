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
  let agregados = 0;
  let rechazados = 0;

  const primeraLinea = fs.readFileSync(archivo.path, 'utf8').split('\n')[0];
  const separador = primeraLinea.includes(';') && !primeraLinea.includes(',') ? ';' : ',';
  console.log('[EstudianteController] 📄 Separador CSV detectado:', separador);

  fs.createReadStream(archivo.path)
    .pipe(csv({ separator: separador }))
    .on('data', (row) => {
      const rut = cleanRut(row?.ID_Estudiante?.toString() || '');
      const nombre = row?.Nombre?.trim();
      const apellido = row?.Apellido?.trim();
      const anio = parseInt(row?.Anio_Ingreso, 10);

      if (rut && nombre && apellido && !isNaN(anio)) {
        if (validarRut(rut)) {
          estudiantes.push({
            ID_Estudiante: rut,
            Nombre: nombre,
            Apellido: apellido,
            Anio_Ingreso: anio
          });
          agregados++;
        } else {
          rechazados++;
        }
      }
    })
    .on('end', async () => {
      try {
        for (const est of estudiantes) {
          const existe = await EstudianteService.existe(est.ID_Estudiante);
          if (existe) {
            await EstudianteService.actualizar(est.ID_Estudiante, est);
          } else {
            await EstudianteService.crear(est);
          }
        }

        res.status(200).json({
          message: `${agregados} estudiantes agregados y ${rechazados} rechazados por RUT inválido`,
          agregados,
          rechazados,
          estudiantes: estudiantes
        });
      } catch (error) {
        console.error('Error al procesar CSV:', error);
        res.status(500).json({ error: 'Error al procesar el archivo CSV' });
      }
    });
};
