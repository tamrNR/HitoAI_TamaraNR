# HitoAI

## Descripción del sistema
HitoAI es una aplicación web que permite gestionar y generar informes académicos. El frontend está desarrollado con Angular y el backend con Node.js y Express, además de utilizar una base de datos MySQL. Opcionalmente puede emplear la API de OpenAI para generar análisis automáticos.

## Tecnologías utilizadas y versiones
- Angular CLI 19.2.12
- Node.js 18+
- Express 5.1.0
- MySQL2 3.14.1
- Bootstrap 5.3.6
- docx 8.0.0 y chartjs-node-canvas 4.0.7 para la generación de informes

## Instrucciones de instalación
1. Clona el repositorio.
2. Instala las dependencias del frontend:
   ```bash
   npm install
   ```
3. Copia el archivo de variables de entorno y configura tus valores:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edita `backend/.env` para definir `OPENAI_API_KEY`, la configuración de la base de datos y cualquier otro valor necesario.
4. Instala las dependencias del backend:
   ```bash
   cd backend
   npm install
   ```

## Instrucciones de ejecución
### Backend
1. Desde la carpeta `backend` inicia el servidor API:
   ```bash
   npm start
   ```
2. Para ejecutar las pruebas del backend:
   ```bash
   npm test
   ```

### Frontend
1. Desde la raíz del proyecto ejecuta:
   ```bash
   npm start
   ```
2. Abre `http://localhost:4200/` en tu navegador.
3. Para ejecutar las pruebas del frontend:
   ```bash
   npm test
   ```

## Recursos adicionales
Para obtener información detallada sobre el uso de Angular CLI visita la [documentación oficial](https://angular.dev/tools/cli).
