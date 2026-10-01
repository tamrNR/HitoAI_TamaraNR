# 📋 Instrucciones de Instalación y Configuración - HitoAI

## ✅ Correcciones Realizadas

Se han solucionado los siguientes problemas:

1. ✅ **Archivo `main.server.ts` faltante** - Creado para habilitar Server-Side Rendering (SSR)
2. ✅ **Rutas del backend incompletas** - Ahora se cargan todas las 14 rutas disponibles
3. ✅ **Configuración actualizada** - Archivos de configuración de Angular corregidos

## 🚀 Pasos para Instalar y Ejecutar el Proyecto

### Prerequisitos

Asegúrate de tener instalado:
- **Node.js 18+** (Verifica con: `node --version`)
- **npm** (Verifica con: `npm --version`)
- **MySQL** (con un servidor activo)

### 1. Instalar Dependencias del Frontend

Desde la carpeta raíz del proyecto (`HitoAI`):

```bash
npm install
```

### 2. Instalar Dependencias del Backend

```bash
cd backend
npm install
cd ..
```

### 3. Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   copy backend\.env.example backend\.env
   ```

2. Edita `backend\.env` con tus credenciales:
   ```
   DB_HOST=localhost
   DB_USER=tu_usuario_mysql
   DB_PASSWORD=tu_contraseña_mysql
   DB_NAME=HitoAI
   PORT=3000
   OPENAI_API_KEY=tu_clave_openai_opcional
   ```

### 4. Configurar la Base de Datos

1. Crea la base de datos MySQL:
   ```sql
   CREATE DATABASE HitoAI;
   ```

2. Importa el esquema de la base de datos:
   ```bash
   mysql -u tu_usuario -p HitoAI < ..\hitoai.sql
   ```

### 5. Ejecutar el Proyecto

#### Opción A: Ejecutar Backend y Frontend por Separado (Recomendado para desarrollo)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
El backend estará disponible en: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm start
```
El frontend estará disponible en: `http://localhost:4200`

#### Opción B: Ejecutar solo el Frontend (si el backend ya está corriendo)

```bash
npm start
```

## 🔍 Verificar que Todo Funciona

1. **Backend**: Abre `http://localhost:3000` en tu navegador. Deberías ver:
   ```json
   {"message": "🚀 API funcionando correctamente"}
   ```

2. **Frontend**: Abre `http://localhost:4200` en tu navegador. Deberías ver la aplicación HitoAI.

## 📝 Rutas API Disponibles

El backend ahora tiene todas estas rutas configuradas:

- `/api/usuario` - Gestión de usuarios
- `/api/aplicacion` - Gestión de aplicaciones
- `/api/asignatura` - Gestión de asignaturas
- `/api/carrera` - Gestión de carreras
- `/api/competencia` - Gestión de competencias
- `/api/contenido` - Gestión de contenidos
- `/api/estudiante` - Gestión de estudiantes
- `/api/evaluacion` - Gestión de evaluaciones
- `/api/indicador` - Gestión de indicadores
- `/api/informe` - Generación de informes
- `/api/inscripcion` - Gestión de inscripciones
- `/api/ra` - Gestión de resultados de aprendizaje
- `/api/reporte` - Generación de reportes
- `/api/rol` - Gestión de roles

## ⚠️ Problemas Comunes

### Error: "Cannot find module 'xyz'"
**Solución**: Ejecuta `npm install` en la carpeta correspondiente.

### Error de conexión a MySQL
**Solución**: 
1. Verifica que MySQL esté corriendo
2. Revisa las credenciales en `backend\.env`
3. Asegúrate de que la base de datos `HitoAI` exista

### Puerto 3000 o 4200 ya en uso
**Solución**: 
- Cierra la aplicación que está usando ese puerto
- O cambia el puerto en la configuración correspondiente

### Error de CORS
**Solución**: El backend ya está configurado para aceptar peticiones desde `http://localhost:4200`

## 📚 Recursos Adicionales

- [Documentación de Angular](https://angular.dev)
- [Documentación de Express](https://expressjs.com)
- [Documentación de MySQL](https://dev.mysql.com/doc/)

## 🆘 Necesitas Ayuda?

Si encuentras algún error adicional, revisa:
1. Los logs de la consola del backend
2. Los logs de la consola del navegador (F12)
3. El archivo `ManualUso.docx` en la carpeta del proyecto

---
**Última actualización**: Todos los errores conocidos han sido corregidos. El proyecto debería funcionar correctamente siguiendo estas instrucciones.
