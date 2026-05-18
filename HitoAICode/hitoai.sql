-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 12, 2025 at 07:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Dumping data for table `aplicacion`
--

INSERT INTO `aplicacion` (`ID_Aplicacion`, `Obtenido`, `Grupo`, `inscripcion_ID_Inscripcion`, `evaluacion_ID_Evaluacion`, `indicador_ID_Indicador`) VALUES
(1, 8, 1, 23, 1, 2),
(2, 10, 1, 23, 1, 3),
(3, 10, 1, 23, 1, 4),
(4, 10, 2, 24, 1, 2),
(5, 7, 2, 24, 1, 3),
(6, 8, 2, 24, 1, 4),
(7, 10, 2, 25, 1, 2),
(8, 7, 2, 25, 1, 3),
(9, 8, 2, 25, 1, 4),
(10, 8, 1, 26, 1, 2),
(11, 10, 1, 26, 1, 3),
(12, 10, 1, 26, 1, 4),
(13, 10, 1, 23, 1, 5),
(14, 10, 1, 23, 1, 6),
(15, 10, 1, 23, 1, 7),
(16, 10, 2, 24, 1, 5),
(17, 8, 2, 24, 1, 6),
(18, 6, 2, 24, 1, 7),
(19, 10, 2, 25, 1, 5),
(20, 8, 2, 25, 1, 6),
(21, 6, 2, 25, 1, 7),
(22, 10, 1, 26, 1, 5),
(23, 10, 1, 26, 1, 6),
(24, 10, 1, 26, 1, 7),
(25, 10, 1, 23, 2, 8),
(26, 10, 1, 23, 2, 9),
(27, 9, 1, 23, 2, 10),
(28, 7, 2, 24, 2, 8),
(29, 8, 2, 24, 2, 9),
(30, 10, 2, 24, 2, 10),
(31, 7, 2, 25, 2, 8),
(32, 8, 2, 25, 2, 9),
(33, 10, 2, 25, 2, 10),
(34, 10, 1, 26, 2, 8),
(35, 10, 1, 26, 2, 9),
(36, 9, 1, 26, 2, 10),
(37, 7, 1, 23, 2, 11),
(38, 10, 1, 23, 2, 12),
(39, 2, 1, 23, 2, 13),
(40, 6, 2, 24, 2, 11),
(41, 1, 2, 24, 2, 12),
(42, 10, 2, 24, 2, 13),
(43, 6, 2, 25, 2, 11),
(44, 1, 2, 25, 2, 12),
(45, 10, 2, 25, 2, 13),
(46, 7, 1, 26, 2, 11),
(47, 10, 1, 26, 2, 12),
(48, 2, 1, 26, 2, 13),
(49, 9, 1, 23, 3, 14),
(50, 8, 1, 23, 3, 15),
(51, 9, 1, 23, 3, 16),
(52, 5, 2, 24, 3, 14),
(53, 6, 2, 24, 3, 15),
(54, 9, 2, 24, 3, 16),
(55, 5, 2, 25, 3, 14),
(56, 6, 2, 25, 3, 15),
(57, 9, 2, 25, 3, 16),
(58, 9, 1, 26, 3, 14),
(59, 8, 1, 26, 3, 15),
(60, 9, 1, 26, 3, 16),
(61, 9, 1, 23, 3, 17),
(62, 9, 2, 24, 3, 17),
(63, 9, 2, 25, 3, 17),
(64, 9, 1, 26, 3, 17);

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
-- Dumping data for table `asignatura`
--

INSERT INTO `asignatura` (`ID_Asignatura`, `Nombre`, `Semestre`, `N_Hito`, `Plan_Academico`, `carrera_ID_Carrera`, `usuario_ID_Usuario`, `Estado`) VALUES
('SII400', 'Sistemas De Informacion 1', 4, 1, 2019, 4, '123668928', 'Activo'),
('TDS100', 'Taller De Desarrollo De Software', 10, 3, 2019, 4, '133569820', 'Activo'),
('TIS800', 'Taller De Ingenieria De Software', 8, 2, 2019, 4, '137934256', 'Activo');

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
-- Dumping data for table `carrera`
--

INSERT INTO `carrera` (`ID_Carrera`, `Nombre`, `facultad_ID_Facultad`, `usuario_ID_Usuario`) VALUES
(4, 'Ingeniería Civil En Informatica', 1, '133771298');

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
-- Dumping data for table `competencia`
--

INSERT INTO `competencia` (`ID_Competencia`, `Nombre`, `Descripcion`, `Tipo`) VALUES
('CD1', 'SOLUCIONES DE TECNOLOGÍAS DE INFORMACIÓN', 'Proponer soluciones de T.I. a problemas organizacionales y/o científicos, aplicando las bases teóricas de la ciencia de la computación en sistemas de información.', 'CD'),
('CD2', 'DESARROLLO DE SOFTWARE ', 'Gestionar proyectos de software de una organización, asegurando la calidad en los procesos de desarrollo, operación o mantenimiento de sistemas.', 'CD'),
('CD3', ' DESARROLLO DE ARQUITECTURA DE TECNOLOGÍAS DE INFORMACIÓN', 'Diseñar soluciones de arquitectura tecnológica que integren componentes de gestión, interconexión, hardware y software, ajustándose a requerimientos de funcionalidad, seguridad, rendimiento y costo de una organización.', 'CD'),
('CG1', 'COMPROMISO CON LA CALIDAD Y LA EXCELENCIA', 'Demostrar un compromiso permanente de búsqueda de la calidad y excelencia en su gestión profesional ejerciendo un liderazgo colaborativo para el logro de propósitos comunes.', 'CG'),
('CG2', 'GESTIÓN DE LA INFORMACIÓN E INNOVACIÓN', 'Desarrollar habilidades comunicacionales y de gestión de la información favoreciendo el desarrollo del pensamiento crítico, así como las capacidades investigativas y de innovación.', 'CG'),
('CP1', 'GESTIÓN EFICIENTE DE LOS RECURSOS', 'Gestionar el uso de los recursos bajo su responsabilidad, integrando eficiencia y productividad en el logro de los objetivos organizacionales.', 'CP'),
('CP2', 'PROPOSICIÓN DE SOLUCIONES VIABLES', 'Proponer soluciones viables a problemáticas propias de su especialidad y área de desempeño, considerando aspectos técnicos, financieros, legales y ambientales, en el desarrollo sostenible de la organización y del entorno en el que se inserta.', 'CP'),
('CS', 'COSMOVISIÓN CRISTIANA', 'Apreciar los valores y principios propios de una cosmovisión cristiana reconociéndolos como una herramienta valiosa para interpretar el mundo con un claro sentido de la ética, de la responsabilidad por el autocuidado, del compromiso ciudadano y de la conservación del medioambiente.', 'CS');

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
-- Dumping data for table `contenido`
--

INSERT INTO `contenido` (`ID_Contenido`, `Nucleo_Tematico`, `Descripcion`, `Horas`, `asignatura_ID_Asignatura`) VALUES
(3, 'Fase 1 - Identificación de Requerimientos y Propuesta de Solución', 'Los estudiantes deberán investigar y realizar un análisis detallado de la problemática real presentada por la organización cliente. Con base en este análisis, deberán elaborar una propuesta de solución que incluya los objetivos del proyecto, los requisitos del sistema y una descripción general de la arquitectura propuesta. Para esto, aplicarán técnicas de obtención de requisitos y seguirán estándares de documentación establecidos.', 20, 'TIS800'),
(4, 'Fase 2 - Diseño del Proyecto Informático', 'En esta fase, los estudiantes deberán especificar los requerimientos de manera detallada y diseñar la arquitectura del sistema de acuerdo con la propuesta presentada anteriormente. El diseño deberá seguir estándares establecidos en la industria y tomar en cuenta aspectos como la seguridad, escalabilidad y usabilidad del sistema.', 10, 'TIS800'),
(5, 'Fase 3 - Desarrollo de la aplicación primer incremento', 'Los estudiantes implementarán el prototipo de software siguiendo la metodología de desarrollo de sistemas seleccionada y aplicarán mecanismos de calidad para garantizar que la solución cumpla con las necesidades de la organización cliente. Deberán utilizar lenguaje de programación SQL y PL/SQL para trabajar con la base de datos y resolver problemáticas planteadas.', 10, 'TIS800'),
(6, 'Fase 4 - Implementación de Analítica y Toma de Decisiones', 'En esta etapa, los estudiantes utilizarán distintos algoritmos y técnicas de analítica para procesar los datos y obtener resultados relevantes. La plataforma deberá proporcionar información visual y estadística que facilite la toma de decisiones por parte de la organización cliente.', 15, 'TIS800'),
(7, 'Fase 5 - Desarrollo de la Aplicación segundo incremento', 'Los estudiantes programarán la aplicación  utilizando lenguaje seleccionado, implementando una arquitectura basada en capas que favorezca la separación de la lógica del negocio y la presentación de la información utilizando un patrón arquitectónico de alto nivel (MVC, MVVM, MVP u otro) que soporte usuarios de al menos dos perfiles  diferentes y reportabilidad dinámica.', 10, 'TIS800'),
(8, 'Fase 6 - Presentación Oral del Proyecto', 'Los estudiantes deberán preparar una presentación que resuma todo el proceso del proyecto, desde la identificación de requerimientos hasta la implementación del prototipo de software y los resultados de analítica obtenidos. Deben asegurarse de destacar los puntos clave y los logros alcanzados durante el desarrollo del proyecto.', 5, 'TIS800');

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
-- Dumping data for table `criterio`
--

INSERT INTO `criterio` (`ID_Criterio`, `Nombre`, `R_Min`, `R_Max`, `indicador_ID_Indicador`) VALUES
(13, 'Bajo', 1, 2, 2),
(14, 'Medio', 3, 5, 2),
(15, 'Alto', 6, 8, 2),
(16, 'Excelente', 9, 10, 2),
(17, 'Bajo', 1, 2, 3),
(18, 'Medio', 3, 5, 3),
(19, 'Alto', 6, 8, 3),
(20, 'Excelente', 9, 10, 3),
(21, 'Bajo', 1, 2, 4),
(22, 'Medio', 3, 5, 4),
(23, 'Alto', 6, 8, 4),
(24, 'Excelente', 9, 10, 4),
(29, 'Bajo', 1, 2, 6),
(30, 'Medio', 3, 5, 6),
(31, 'Alto', 6, 8, 6),
(32, 'Excelente', 9, 10, 6),
(33, 'Bajo', 1, 2, 5),
(34, 'Medio', 3, 5, 5),
(35, 'Alto', 6, 8, 5),
(36, 'Excelente', 9, 10, 5),
(37, 'Bajo', 1, 2, 7),
(38, 'Medio', 3, 5, 7),
(39, 'Alto', 6, 8, 7),
(40, 'Excelente', 9, 10, 7),
(41, 'Bajo', 1, 2, 8),
(42, 'Medio', 3, 5, 8),
(43, 'Alto', 6, 8, 8),
(44, 'Excelente', 9, 10, 8),
(45, 'Bajo', 1, 2, 9),
(46, 'Medio', 3, 5, 9),
(47, 'Alto', 6, 8, 9),
(48, 'Excelente', 9, 10, 9),
(49, 'Bajo', 1, 2, 10),
(50, 'Medio', 3, 5, 10),
(51, 'Alto', 6, 8, 10),
(52, 'Excelente', 9, 10, 10),
(53, 'Bajo', 1, 2, 11),
(54, 'Medio', 3, 5, 11),
(55, 'Alto', 6, 8, 11),
(56, 'Excelente', 9, 10, 11),
(57, 'Bajo', 1, 2, 12),
(58, 'Medio', 3, 5, 12),
(59, 'Alto', 6, 8, 12),
(60, 'Excelente', 9, 10, 12),
(61, 'Bajo', 1, 2, 13),
(62, 'Medio', 3, 5, 13),
(63, 'Alto', 6, 8, 13),
(64, 'Excelente', 9, 10, 13),
(65, 'Bajo', 1, 2, 14),
(66, 'Medio', 3, 5, 14),
(67, 'Alto', 6, 8, 14),
(68, 'Excelente', 9, 10, 14),
(69, 'Bajo', 1, 2, 15),
(70, 'Medio', 3, 5, 15),
(71, 'Alto', 6, 8, 15),
(72, 'Excelente', 9, 10, 15),
(73, 'Bajo', 1, 2, 16),
(74, 'Medio', 3, 5, 16),
(75, 'Alto', 6, 8, 16),
(76, 'Excelente', 9, 10, 16),
(77, 'Bajo', 1, 2, 17),
(78, 'Medio', 3, 5, 17),
(79, 'Alto', 6, 8, 17),
(80, 'Excelente', 9, 10, 17);

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
-- Dumping data for table `estudiante`
--

INSERT INTO `estudiante` (`ID_Estudiante`, `Nombre`, `Apellido`, `Anio_Ingreso`) VALUES
('20268128K', 'Pedro', 'Lara', 2020),
('205001131', 'Rene', 'Meza', 2020),
('206281847', 'Francisco ', 'Suarez', 2020),
('209390957', 'Fabian', 'Pavez', 2020),
('219992076', 'Martin', 'Aguilera', 2020);

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
-- Dumping data for table `evaluacion`
--

INSERT INTO `evaluacion` (`ID_Evaluacion`, `Nombre`, `Tipo`, `N_Instancia`, `Fecha`) VALUES
(1, 'Primera Instancia', 'Documento', 1, '2025-08-06'),
(2, 'Segunda Instacia', 'Programa', 2, '2025-08-06'),
(3, 'Tercera Instancia', 'Presentacion', 3, '2025-08-06');

-- --------------------------------------------------------

--
-- Table structure for table `facultad`
--

CREATE TABLE `facultad` (
  `ID_Facultad` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `facultad`
--

INSERT INTO `facultad` (`ID_Facultad`, `Nombre`) VALUES
(1, 'FAIN - Facultad de Ingeniería y Negocios');

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
-- Dumping data for table `indicador`
--

INSERT INTO `indicador` (`ID_Indicador`, `Descripcion`, `Puntaje_Max`, `contenido_ID_Contenido`, `ra_ID_RA`) VALUES
(2, 'Investigación de la problemática actual de la organización cliente y análisis de sus necesidades. ', 10, 3, 14),
(3, 'Identificación de los objetivos del proyecto y definición de los requerimientos del sistema. ', 10, 3, 13),
(4, 'Elaboración de la propuesta de solución, incluyendo la descripción general del sistema, su arquitectura propuesta y los beneficios esperados. ', 10, 3, 11),
(5, 'Especificación detallada de los requerimientos del sistema, descomponiéndose en funcionalidades y características. ', 10, 4, 12),
(6, 'Diseño de la arquitectura del sistema, definiendo las diferentes capas y componentes. ', 10, 4, 13),
(7, 'Creación de diagramas  para representar el diseño del sistema.', 10, 4, 14),
(8, 'Implementación del prototipo de software basado en el diseño definido anteriormente, cumpliendo con el 50% de los requisitos . ', 10, 5, 13),
(9, 'Aplicación de pruebas unitarias para verificar la funcionalidad y corrección del código', 10, 5, 13),
(10, 'Documentación del código y resultados de pruebas. ', 10, 5, 11),
(11, 'Selección de algoritmos y técnicas de analítica adecuadas para el procesamiento de los datos de la organización cliente.', 10, 6, 14),
(12, 'Implementación de los algoritmos y técnicas seleccionadas en el prototipo de software. RA5(CD1)', 10, 6, 12),
(13, 'Generación de informes y visualizaciones de los resultados de analítica.', 10, 6, 12),
(14, 'Programación de la aplicación utilizando lenguaje seleccionado, considerando las buenas prácticas de desarrollo. ', 10, 7, 13),
(15, 'Implementación de la arquitectura basada en capas para separar la lógica del negocio y la presentación.', 10, 7, 13),
(16, 'Diseño de la interfaz gráfica para facilitar la interacción del usuario. ', 10, 7, 12),
(17, 'Selección de Herramienta Tecnológica para la Presentación.\nDiseño de la Presentación:\nDemostración del Prototipo\nExplicación Técnica\nRespuesta a Preguntas ', 10, 8, 13);

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
-- Dumping data for table `inscripcion`
--

INSERT INTO `inscripcion` (`ID_Inscripcion`, `Anio`, `Semestre`, `estudiante_ID_Estudiante`, `asignatura_ID_Asignatura`, `Estado`) VALUES
(23, 2025, 8, '20268128K', 'TIS800', 'Activo'),
(24, 2025, 8, '205001131', 'TIS800', 'Activo'),
(25, 2025, 8, '206281847', 'TIS800', 'Activo'),
(26, 2025, 8, '209390957', 'TIS800', 'Activo');

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
-- Dumping data for table `ra`
--

INSERT INTO `ra` (`ID_RA`, `Nombre`, `Descripcion`, `asignatura_ID_Asignatura`) VALUES
(4, 'RA1', 'Integra conocimientos sobre el área de estudio y la importancia de una investigación en su profesión.', 'SII400'),
(5, 'RA2', 'Diseña diagramas utilizando UML implementando los pilares fundamentales de la programación orientada a objetos', 'SII400'),
(6, 'RA3', 'utiliza las instrucciones propias del lenguaje de programación orientado a objetos para dar solución a problemas planteados aplicando buenas prácticas, implementando un modelo de dos capas.', 'SII400'),
(7, 'RA4', '\nDiseña la solución del software ajustándose a la arquitectura explicitada en un diagrama de componentes\n', 'SII400'),
(8, 'RA5', 'Utiliza esquemas básicos de las estructuras y algoritmos de las TDA lineales y no lineales satisfaciendo distintas especificaciones', 'SII400'),
(9, 'RA6 ', 'Programa una aplicación web PHP orientada a objetos y HTML5 implementando una arquitectura basada en capas.', 'SII400'),
(10, 'RA7', 'Recopila los requerimientos necesarios para la resolución del problema, elaborando la especificación de estos a través de diagramas UML de diseño, validando la concordancia de dichos requerimientos con la solución.', 'SII400'),
(11, 'RA1', 'Elabora propuesta de solución de un   proyecto informático a una problemática actual de un caso real, utilizando técnicas de obtención de requisitos.', 'TIS800'),
(12, 'RA2', 'Específica requerimientos y su diseño de una propuesta del proyecto informático documentando de acuerdo a estándares establecidos.', 'TIS800'),
(13, 'RA3', 'Desarrollar un proyecto informático, de acuerdo con los requerimientos dados aplicando estándares de calidad, en un caso real.', 'TIS800'),
(14, 'RA4', 'Aplica instrucciones de lenguaje de programación SQL y PL/SQL relacionadas a problemáticas planteadas.', 'TIS800'),
(15, 'RA1', 'Aplica los conocimientos adquiridos en las diversas asignaturas de la competencia desarrollo de software permitiendo un correcto análisis de una problemática además de un diseño de la solución para la misma, enfocada en una empresa real.', 'TDS100'),
(16, 'RA2', 'Aporta con soluciones innovadoras y creativas aplicando los conocimientos de algoritmia y programación, a problemas del mundo real.', 'TDS100');

-- --------------------------------------------------------

--
-- Table structure for table `ra_competencia`
--

CREATE TABLE `ra_competencia` (
  `competencia_ID_Competencia` varchar(10) NOT NULL,
  `ra_ID_RA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `ra_competencia`
--

INSERT INTO `ra_competencia` (`competencia_ID_Competencia`, `ra_ID_RA`) VALUES
('CG1', 4),
('CP2', 5),
('CD1', 6),
('CD2', 7),
('CG1', 8),
('CP2', 9),
('CD2', 10),
('CP2', 11),
('CD2', 12),
('CP2', 12),
('CD2', 13),
('CG1', 13),
('CP2', 13),
('CD2', 14),
('CD2', 15),
('CG2', 15),
('CG2', 16),
('CD1', 16);

-- --------------------------------------------------------

--
-- Table structure for table `rol`
--

CREATE TABLE `rol` (
  `ID_Rol` int(11) NOT NULL,
  `Nombre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `rol`
--

INSERT INTO `rol` (`ID_Rol`, `Nombre`) VALUES
(1, 'Administrador'),
(2, 'Jefe de Carrera'),
(3, 'Profesor'),
(4, 'Comité Curricular');

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
-- Dumping data for table `usuario`
--

INSERT INTO `usuario` (`ID_Usuario`, `Nombre`, `Clave`, `Rol_ID_Rol`) VALUES
('123668928', 'Pablo Calderón', '$2b$10$Yir4Z5uuq0cKTK0srA1P0unVaUKvbOH7v.C8YyIj0ebMvk6Ch0BDu', 3),
('133569820', 'Jose Neira', '$2b$10$OUDX/QabXgPLsMpg2I85l.HACHfDLVXbsTc6OVIyvoQJp/fCT8kI2', 3),
('133771298', 'Karen Muñoz', '$2b$10$xgiVeXs6KGBHzYSvfzeSPuZfDhBUaL7TDFr/PMt8ltMnho7RbpYGu', 2),
('137934256', 'Dennise Quintana', '$2b$10$yuphsFdIFpISAJj5bV0Jlu1mOIoC4lQ1hqgpqmWKHMVJABuS0CgUy', 3),
('195110158', 'Guipsy Rebolledo', '$2b$10$c0MEa1wObr8QQKMdreNT4.tP0u8K00gLPA9uoSAkRNdubjunHEJEu', 2),
('20268128K', 'Pedro Lara', '$2b$10$WF2Hb2MtwkGp96vIhRhbUOTBTs3COaPPivzqjl14RlLvzujMzBMF2', 1),
('209390957', 'Fabian Pavez', '$2b$10$b4.xgCWKUrix2ZCbzt3ptuo3hvlfAu4WSkpCSOtWExe92jm4PX.Ya', 1),
('250479883', 'Monica Acosta Zambrano', '$2b$10$gvLJP7KWbDzKBk3IDE1jTuMdx/A7KTVMPi4PqWlcKOEcth.o3VgFm', 4);

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
