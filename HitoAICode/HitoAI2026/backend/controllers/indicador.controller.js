const IndicadorService = require('../services/indicador.service');

exports.obtenerPorContenido = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await IndicadorService.obtenerPorContenido(id);
    res.json(data);
  } catch (err) {
    console.error('❌ ERROR AL OBTENER INDICADORES:', err);
    res.status(500).json({ message: 'Error al obtener indicadores', error: err });
  }
};

exports.crear = async (req, res) => {
  try {
    const datos = req.body;

    // Si se recibe { indicador, criterios } desde el frontend
    if (datos.indicador && Array.isArray(datos.criterios)) {
      datos.indicador.Criterios = datos.criterios;
      await IndicadorService.crear(datos.indicador);
    } else {
      await IndicadorService.crear(datos);
    }

    res.status(201).json({ message: 'Indicador creado' });
  } catch (err) {
    console.error('❌ ERROR AL CREAR INDICADOR:', err);
    res.status(500).json({ message: 'Error al crear indicador', error: err });
  }
};

exports.actualizar = async (req, res) => {
  const id = req.params.id;
  try {
    const datos = req.body;

    if (datos.indicador && Array.isArray(datos.criterios)) {
      datos.indicador.Criterios = datos.criterios;
      await IndicadorService.actualizar(id, datos.indicador);
    } else {
      await IndicadorService.actualizar(id, datos);
    }

    res.json({ message: 'Indicador actualizado' });
  } catch (err) {
    console.error('❌ ERROR AL ACTUALIZAR INDICADOR:', err);
    res.status(500).json({ message: 'Error al actualizar indicador', error: err });
  }
};

exports.eliminar = async (req, res) => {
  const id = req.params.id;
  try {
    await IndicadorService.eliminar(id);
    res.json({ message: 'Indicador eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar indicador' });
  }
};



exports.obtenerCriteriosPorIndicador = async (req, res) => {
  const { id } = req.params;
  try {
    const criterios = await IndicadorService.obtenerCriteriosPorIndicador(id);
    res.json(criterios);
  } catch (err) {
    console.error('Error al obtener criterios del indicador:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
