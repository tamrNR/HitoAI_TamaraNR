// Middleware de autorización basado en roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Obtener el rol del usuario desde el header (enviado por el frontend)
    const userRole = req.headers['x-user-role'];
    
    if (!userRole) {
      console.warn('[AuthMiddleware] ❌ No se proporcionó el rol del usuario');
      return res.status(401).json({ error: 'No autorizado: rol no proporcionado' });
    }

    // Normalizar el rol (minúsculas, sin acentos)
    const normalizedUserRole = userRole.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedAllowedRoles = allowedRoles.map(role => 
      role.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    // Verificar si el rol está permitido
    const hasAccess = normalizedAllowedRoles.includes(normalizedUserRole);

    if (!hasAccess) {
      console.warn(`[AuthMiddleware] ⚠️ Rol no permitido. Usuario: ${userRole}, Permitidos: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ error: 'No autorizado: rol no permitido para este recurso' });
    }

    console.log(`[AuthMiddleware] ✅ Acceso permitido para rol: ${userRole}`);
    next();
  };
};

module.exports = { authorizeRoles };
