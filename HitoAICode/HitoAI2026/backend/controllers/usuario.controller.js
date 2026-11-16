const UsuarioService = require('../services/usuario.service');
const { validateLengths } = require('../utils/validateLengths');
const { normalize } = require('../middleware/auth.middleware');
const jwt = require('jsonwebtoken');

// Crear nuevo usuario
exports.crearUsuario = async (req, res) => {
  const { ID_Usuario, Nombre, Clave, Rol_ID_Rol, Facultad_ID_Facultad } = req.body;
  const rut = ID_Usuario.replace(/\./g, '').replace(/-/g, '').toUpperCase();

  if (!ID_Usuario || !Nombre || !Clave || !Rol_ID_Rol) {
    return res.status(400).json({ message: 'Faltan datos requeridos para crear el usuario' });
  }

  const err = validateLengths({ ID_Usuario: rut, Nombre, Clave }, {
    ID_Usuario: 10,
    Nombre: 100,
    Clave: 100
  });
  if (err) return res.status(400).json({ message: err });

  const facultadId = Facultad_ID_Facultad !== undefined && Facultad_ID_Facultad !== null && Facultad_ID_Facultad !== ''
    ? parseInt(Facultad_ID_Facultad, 10)
    : null;
  if (facultadId !== null && (Number.isNaN(facultadId) || facultadId <= 0)) {
    return res.status(400).json({ message: 'Facultad_ID_Facultad inválida' });
  }

  try {
    const existe = await UsuarioService.existe(rut);
    if (existe) {
      return res.status(400).json({ message: 'Usuario ya registrado' });
    }

    await UsuarioService.crearUsuario(rut, Nombre, Clave, Rol_ID_Rol, facultadId);
    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Usuario ya registrado' });
    }
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// Validar login
exports.login = async (req, res) => {
  const { ID_Usuario, Clave } = req.body;
  if (!ID_Usuario || !Clave || typeof ID_Usuario !== 'string' || typeof Clave !== 'string') {
    return res.status(400).json({ message: 'RUT y clave son requeridos' });
  }
  const rut = ID_Usuario.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  try {
    const resultado = await UsuarioService.validarLogin(rut, Clave);
    if (resultado?.error === 'not_found') {
      return res.status(404).json({ message: 'RUT no registrado' });
    }
    if (resultado?.error === 'invalid_password') {
      return res.status(401).json({ message: 'Clave incorrecta' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no configurado');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      {
        sub: resultado.ID_Usuario,
        nombre: resultado.Nombre,
        rol: resultado.Rol,
        carreraId: resultado.Carrera_ID ?? null,
        facultadId: resultado.Facultad_ID_Facultad ?? null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      ID_Usuario: resultado.ID_Usuario,
      Nombre: resultado.Nombre,
      Rol: resultado.Rol,
      carreraId: resultado.Carrera_ID ?? null,
      facultadId: resultado.Facultad_ID_Facultad ?? null
    });
  } catch (error) {
    console.error('Error login backend:', error);
    res.status(500).json({ message: 'Error en el login' });
  }
};

// Obtener jefes de carrera
exports.getJefesCarrera = async (req, res) => {
  try {
    const jefes = await UsuarioService.getJefesCarrera();
    res.json(jefes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener jefes de carrera' });
  }
};

// Obtener profesores
exports.getProfesores = async (req, res) => {
  try {
    const profesores = await UsuarioService.getProfesores();
    res.json(profesores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener profesores' });
  }
};

// Obtener todos los usuarios
exports.getTodos = async (req, res) => {
  try {
    const usuarios = await UsuarioService.getTodos();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Actualizar clave (solo el propio usuario o Administrador)
exports.actualizarClave = async (req, res) => {
  const { id } = req.params;
  const { clave } = req.body;

  const esAdmin = req.user && normalize(req.user.rol) === 'administrador';
  const esPropio = req.user && String(req.user.id) === String(id);
  if (!esAdmin && !esPropio) {
    return res.status(403).json({ message: 'No autorizado: solo puedes cambiar tu propia clave' });
  }

  if (!clave) {
    return res.status(400).json({ message: 'La clave es requerida' });
  }

  const err = validateLengths({ clave }, { clave: 100 });
  if (err) return res.status(400).json({ message: err });

  try {
    await UsuarioService.actualizarClave(id, clave);
    res.json({ message: 'Clave actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar clave' });
  }
};

// Actualizar rol
exports.actualizarRol = async (req, res) => {
  const { id } = req.params;
  const { rolId } = req.body;
  if (!rolId) {
    return res.status(400).json({ message: 'Rol requerido' });
  }
  try {
    await UsuarioService.actualizarRol(id, rolId);
    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar rol' });
  }
};

// Eliminar usuario
exports.eliminar = async (req, res) => {
  const { id } = req.params;
  try {
    await UsuarioService.eliminar(id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
