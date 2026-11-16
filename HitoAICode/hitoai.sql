-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 12, 2025 at 07:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

-- ============================================================
-- DUMP SOLO DE ESTRUCTURA (sin datos).
-- Los INSERT fueron eliminados porque contenían datos reales
-- (usuarios, RUT, nombres, hashes de clave, notas de alumnos).
-- Para regenerar desde la BD real:
--   mysqldump -u USUARIO -p --no-data --routines --triggers HitoAI > hitoai.sql
-- Ver ESQUEMA-BD.md para el estado real del esquema (este dump
-- está desactualizado respecto al código: faltan ai_analisis,
-- evaluacion_estudiante, vistas vw_logro_* y columnas nuevas).
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hitoai`
--

-- --------------------------------------------------------

--
-- Table structure for table `aplicacion`
--

CREATE TABLE `aplicacion` (
  `ID_Aplicacion` int(11) NOT NULL,
  `Obtenido` int(11) DEFAULT NULL,
  `Grupo` int(11) NOT NULL DEFAULT 0,
  `inscripcion_ID_Inscripcion` int(11) NOT NULL,
  `evaluacion_ID_Evaluacion` int(11) NOT NULL,
  `indicador_ID_Indicador` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `asignatura`
--

CREATE TABLE `asignatura` (
  `ID_Asignatura` varchar(10) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `Semestre` int(2) DEFAULT NULL,
  `N_Hito` int(1) DEFAULT NULL,
  `Plan_Academico` int(4) DEFAULT NULL,
  `carrera_ID_Carrera` int(11) NOT NULL,
  `usuario_ID_Usuario` varchar(10) NOT NULL,
  `Estado` enum('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `carrera`
--

CREATE TABLE `carrera` (
  `ID_Carrera` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `facultad_ID_Facultad` int(11) NOT NULL,
  `usuario_ID_Usuario` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `competencia`
--

CREATE TABLE `competencia` (
  `ID_Competencia` varchar(10) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `Descripcion` varchar(1000) DEFAULT NULL,
  `Tipo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `contenido`
--

CREATE TABLE `contenido` (
  `ID_Contenido` int(11) NOT NULL,
  `Nucleo_Tematico` varchar(100) DEFAULT NULL,
  `Descripcion` varchar(500) DEFAULT NULL,
  `Horas` int(11) DEFAULT NULL,
  `asignatura_ID_Asignatura` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `criterio`
--

CREATE TABLE `criterio` (
  `ID_Criterio` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `R_Min` int(2) DEFAULT NULL,
  `R_Max` int(2) DEFAULT NULL,
  `indicador_ID_Indicador` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `estudiante`
--

CREATE TABLE `estudiante` (
  `ID_Estudiante` varchar(10) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `Apellido` varchar(100) DEFAULT NULL,
  `Anio_Ingreso` int(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `evaluacion`
--

CREATE TABLE `evaluacion` (
  `ID_Evaluacion` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `Tipo` varchar(100) DEFAULT NULL,
  `N_Instancia` int(1) DEFAULT NULL,
  `Fecha` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `facultad`
--

CREATE TABLE `facultad` (
  `ID_Facultad` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `indicador`
--

CREATE TABLE `indicador` (
  `ID_Indicador` int(11) NOT NULL,
  `Descripcion` varchar(255) DEFAULT NULL,
  `Puntaje_Max` int(11) DEFAULT NULL,
  `contenido_ID_Contenido` int(11) NOT NULL,
  `ra_ID_RA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `inscripcion`
--

CREATE TABLE `inscripcion` (
  `ID_Inscripcion` int(11) NOT NULL,
  `Anio` int(4) DEFAULT NULL,
  `Semestre` int(2) DEFAULT NULL,
  `estudiante_ID_Estudiante` varchar(10) NOT NULL,
  `asignatura_ID_Asignatura` varchar(10) NOT NULL,
  `Estado` enum('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `ra`
--

CREATE TABLE `ra` (
  `ID_RA` int(11) NOT NULL,
  `Nombre` text DEFAULT NULL,
  `Descripcion` varchar(255) DEFAULT NULL,
  `asignatura_ID_Asignatura` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `ra_competencia`
--

CREATE TABLE `ra_competencia` (
  `competencia_ID_Competencia` varchar(10) NOT NULL,
  `ra_ID_RA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `rol`
--

CREATE TABLE `rol` (
  `ID_Rol` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

-- --------------------------------------------------------

--
-- Table structure for table `usuario`
--

CREATE TABLE `usuario` (
  `ID_Usuario` varchar(10) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL,
  `Clave` varchar(100) DEFAULT NULL,
  `Rol_ID_Rol` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
--

-- (datos omitidos: el dump original contiene datos reales; ver ESQUEMA-BD.md)

--
-- Indexes for dumped tables
--

--
-- Indexes for table `aplicacion`
--
ALTER TABLE `aplicacion`
  ADD PRIMARY KEY (`ID_Aplicacion`),
  ADD KEY `fk_aplicacion_inscripcion1_idx` (`inscripcion_ID_Inscripcion`),
  ADD KEY `fk_aplicacion_evaluacion1_idx` (`evaluacion_ID_Evaluacion`),
  ADD KEY `fk_aplicacion_indicador1_idx` (`indicador_ID_Indicador`);

--
-- Indexes for table `asignatura`
--
ALTER TABLE `asignatura`
  ADD PRIMARY KEY (`ID_Asignatura`),
  ADD KEY `fk_asignatura_carrera1_idx` (`carrera_ID_Carrera`),
  ADD KEY `fk_asignatura_usuario1_idx` (`usuario_ID_Usuario`);

--
-- Indexes for table `carrera`
--
ALTER TABLE `carrera`
  ADD PRIMARY KEY (`ID_Carrera`),
  ADD KEY `fk_carrera_facultad1_idx` (`facultad_ID_Facultad`),
  ADD KEY `fk_carrera_usuario1_idx` (`usuario_ID_Usuario`);

--
-- Indexes for table `competencia`
--
ALTER TABLE `competencia`
  ADD PRIMARY KEY (`ID_Competencia`);

--
-- Indexes for table `contenido`
--
ALTER TABLE `contenido`
  ADD PRIMARY KEY (`ID_Contenido`),
  ADD KEY `fk_contenido_asignatura1_idx` (`asignatura_ID_Asignatura`);

--
-- Indexes for table `criterio`
--
ALTER TABLE `criterio`
  ADD PRIMARY KEY (`ID_Criterio`),
  ADD KEY `fk_criterio_indicador1_idx` (`indicador_ID_Indicador`);

--
-- Indexes for table `estudiante`
--
ALTER TABLE `estudiante`
  ADD PRIMARY KEY (`ID_Estudiante`);

--
-- Indexes for table `evaluacion`
--
ALTER TABLE `evaluacion`
  ADD PRIMARY KEY (`ID_Evaluacion`);

--
-- Indexes for table `facultad`
--
ALTER TABLE `facultad`
  ADD PRIMARY KEY (`ID_Facultad`);

--
-- Indexes for table `indicador`
--
ALTER TABLE `indicador`
  ADD PRIMARY KEY (`ID_Indicador`),
  ADD KEY `fk_indicador_contenido1_idx` (`contenido_ID_Contenido`),
  ADD KEY `fk_indicador_ra1_idx` (`ra_ID_RA`);

--
-- Indexes for table `inscripcion`
--
ALTER TABLE `inscripcion`
  ADD PRIMARY KEY (`ID_Inscripcion`),
  ADD KEY `fk_inscripcion_estudiante1_idx` (`estudiante_ID_Estudiante`),
  ADD KEY `fk_inscripcion_asignatura1_idx` (`asignatura_ID_Asignatura`);

--
-- Indexes for table `ra`
--
ALTER TABLE `ra`
  ADD PRIMARY KEY (`ID_RA`),
  ADD KEY `fk_ra_asignatura1_idx` (`asignatura_ID_Asignatura`);

--
-- Indexes for table `ra_competencia`
--
ALTER TABLE `ra_competencia`
  ADD KEY `fk_ra_competencia_competencia1_idx` (`competencia_ID_Competencia`),
  ADD KEY `fk_ra_competencia_ra1_idx` (`ra_ID_RA`);

--
-- Indexes for table `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`ID_Rol`);

--
-- Indexes for table `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_Usuario`),
  ADD KEY `fk_usuario_Rol1_idx` (`Rol_ID_Rol`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aplicacion`
--
ALTER TABLE `aplicacion`
  MODIFY `ID_Aplicacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `carrera`
--
ALTER TABLE `carrera`
  MODIFY `ID_Carrera` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `contenido`
--
ALTER TABLE `contenido`
  MODIFY `ID_Contenido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `criterio`
--
ALTER TABLE `criterio`
  MODIFY `ID_Criterio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `evaluacion`
--
ALTER TABLE `evaluacion`
  MODIFY `ID_Evaluacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `facultad`
--
ALTER TABLE `facultad`
  MODIFY `ID_Facultad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `indicador`
--
ALTER TABLE `indicador`
  MODIFY `ID_Indicador` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `inscripcion`
--
ALTER TABLE `inscripcion`
  MODIFY `ID_Inscripcion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `ra`
--
ALTER TABLE `ra`
  MODIFY `ID_RA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `rol`
--
ALTER TABLE `rol`
  MODIFY `ID_Rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aplicacion`
--
ALTER TABLE `aplicacion`
  ADD CONSTRAINT `fk_aplicacion_evaluacion1` FOREIGN KEY (`evaluacion_ID_Evaluacion`) REFERENCES `evaluacion` (`ID_Evaluacion`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_aplicacion_indicador1` FOREIGN KEY (`indicador_ID_Indicador`) REFERENCES `indicador` (`ID_Indicador`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_aplicacion_inscripcion1` FOREIGN KEY (`inscripcion_ID_Inscripcion`) REFERENCES `inscripcion` (`ID_Inscripcion`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `asignatura`
--
ALTER TABLE `asignatura`
  ADD CONSTRAINT `fk_asignatura_carrera1` FOREIGN KEY (`carrera_ID_Carrera`) REFERENCES `carrera` (`ID_Carrera`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_asignatura_usuario1` FOREIGN KEY (`usuario_ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `carrera`
--
ALTER TABLE `carrera`
  ADD CONSTRAINT `fk_carrera_facultad1` FOREIGN KEY (`facultad_ID_Facultad`) REFERENCES `facultad` (`ID_Facultad`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_carrera_usuario1` FOREIGN KEY (`usuario_ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `contenido`
--
ALTER TABLE `contenido`
  ADD CONSTRAINT `fk_contenido_asignatura1` FOREIGN KEY (`asignatura_ID_Asignatura`) REFERENCES `asignatura` (`ID_Asignatura`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `criterio`
--
ALTER TABLE `criterio`
  ADD CONSTRAINT `fk_criterio_indicador1` FOREIGN KEY (`indicador_ID_Indicador`) REFERENCES `indicador` (`ID_Indicador`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `indicador`
--
ALTER TABLE `indicador`
  ADD CONSTRAINT `fk_indicador_contenido1` FOREIGN KEY (`contenido_ID_Contenido`) REFERENCES `contenido` (`ID_Contenido`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_indicador_ra1` FOREIGN KEY (`ra_ID_RA`) REFERENCES `ra` (`ID_RA`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `inscripcion`
--
ALTER TABLE `inscripcion`
  ADD CONSTRAINT `fk_inscripcion_asignatura1` FOREIGN KEY (`asignatura_ID_Asignatura`) REFERENCES `asignatura` (`ID_Asignatura`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_inscripcion_estudiante1` FOREIGN KEY (`estudiante_ID_Estudiante`) REFERENCES `estudiante` (`ID_Estudiante`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `ra`
--
ALTER TABLE `ra`
  ADD CONSTRAINT `fk_ra_asignatura1` FOREIGN KEY (`asignatura_ID_Asignatura`) REFERENCES `asignatura` (`ID_Asignatura`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `ra_competencia`
--
ALTER TABLE `ra_competencia`
  ADD CONSTRAINT `fk_ra_competencia_competencia1` FOREIGN KEY (`competencia_ID_Competencia`) REFERENCES `competencia` (`ID_Competencia`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_ra_competencia_ra1` FOREIGN KEY (`ra_ID_RA`) REFERENCES `ra` (`ID_RA`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_Rol1` FOREIGN KEY (`Rol_ID_Rol`) REFERENCES `rol` (`ID_Rol`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
