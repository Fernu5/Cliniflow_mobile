-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: clinica
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agenda_medico`
--

DROP TABLE IF EXISTS `agenda_medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agenda_medico` (
  `id_agenda` int NOT NULL AUTO_INCREMENT,
  `medico` int NOT NULL,
  `especialidade` int NOT NULL,
  `data_agenda` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `status_agenda` enum('Disponivel','Bloqueada') DEFAULT 'Disponivel',
  PRIMARY KEY (`id_agenda`),
  KEY `medico` (`medico`),
  KEY `especialidade` (`especialidade`),
  CONSTRAINT `agenda_medico_ibfk_1` FOREIGN KEY (`medico`) REFERENCES `perfis` (`id_perfil`),
  CONSTRAINT `agenda_medico_ibfk_2` FOREIGN KEY (`especialidade`) REFERENCES `especialidades` (`id_especialidade`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agenda_medico`
--

LOCK TABLES `agenda_medico` WRITE;
/*!40000 ALTER TABLE `agenda_medico` DISABLE KEYS */;
INSERT INTO `agenda_medico` VALUES (2,3,1,'2026-08-15','08:00:00','12:00:00','Disponivel'),(3,5,2,'2026-08-11','19:00:00','21:00:00','Disponivel'),(4,5,2,'2026-08-20','08:00:00','12:00:00','Disponivel'),(5,5,2,'2026-08-20','10:00:00','15:00:00','Disponivel'),(6,5,2,'2026-08-30','08:00:00','11:00:00','Disponivel'),(7,5,2,'2026-09-06','09:00:00','11:00:00','Disponivel'),(8,3,1,'2026-09-07','09:00:00','11:00:00','Disponivel');
/*!40000 ALTER TABLE `agenda_medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultas`
--

DROP TABLE IF EXISTS `consultas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultas` (
  `id_consulta` int NOT NULL AUTO_INCREMENT,
  `paciente` int NOT NULL,
  `medico` int NOT NULL,
  `status_consulta` enum('Agendada','Concluida','Cancelada','Faltou') DEFAULT NULL,
  `data_hora_consulta_inicio` datetime NOT NULL,
  `data_hora_consulta_fim` datetime NOT NULL,
  PRIMARY KEY (`id_consulta`),
  KEY `paciente` (`paciente`),
  KEY `medico` (`medico`),
  CONSTRAINT `consultas_ibfk_1` FOREIGN KEY (`paciente`) REFERENCES `perfis` (`id_perfil`),
  CONSTRAINT `consultas_ibfk_2` FOREIGN KEY (`medico`) REFERENCES `perfis` (`id_perfil`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultas`
--

LOCK TABLES `consultas` WRITE;
/*!40000 ALTER TABLE `consultas` DISABLE KEYS */;
INSERT INTO `consultas` VALUES (1,1,3,'Cancelada','2026-04-30 09:00:00','2026-04-30 09:30:00'),(2,2,3,'Cancelada','2026-04-30 09:30:00','2026-04-30 10:00:00'),(3,1,3,'Agendada','2026-05-15 08:00:00','2026-05-15 08:30:00'),(4,1,3,'Cancelada','2026-05-15 08:30:00','2026-05-15 09:00:00'),(5,4,3,'Cancelada','2026-08-15 10:30:00','2026-08-15 11:00:00'),(6,4,3,'Cancelada','2026-08-15 11:30:00','2026-08-15 12:00:00'),(7,4,3,'Cancelada','2026-08-15 09:30:00','2026-08-15 10:00:00'),(8,4,3,'Cancelada','2026-08-15 08:30:00','2026-08-15 09:00:00'),(9,4,3,'Cancelada','2026-08-15 09:00:00','2026-08-15 09:30:00'),(10,4,3,'Cancelada','2026-08-15 10:00:00','2026-08-15 10:30:00'),(11,4,3,'Cancelada','2026-08-15 11:00:00','2026-08-15 11:30:00'),(12,1,3,'Agendada','2026-08-15 08:00:00','2026-08-15 08:30:00'),(13,1,3,'Agendada','2026-05-15 10:00:00','2026-05-15 10:30:00'),(14,2,5,'Concluida','2026-08-11 19:00:00','2026-08-11 19:30:00'),(15,4,5,'Faltou','2026-08-20 10:00:00','2026-08-20 10:30:00'),(16,4,5,'Cancelada','2026-08-20 08:00:00','2026-08-20 08:30:00'),(17,6,3,'Faltou','2026-08-15 09:30:00','2026-08-15 10:00:00'),(18,6,5,'Concluida','2026-08-30 08:00:00','2026-08-30 08:30:00'),(19,6,5,'Faltou','2026-08-30 08:30:00','2026-08-30 09:00:00'),(20,4,5,'Agendada','2026-08-20 11:30:00','2026-08-20 12:00:00');
/*!40000 ALTER TABLE `consultas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especialidades`
--

DROP TABLE IF EXISTS `especialidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especialidades` (
  `id_especialidade` int NOT NULL AUTO_INCREMENT,
  `tipo_especialidade` enum('Ortopedia','Reumatologia','Fisiatria') DEFAULT NULL,
  `nome_especialidade` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_especialidade`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especialidades`
--

LOCK TABLES `especialidades` WRITE;
/*!40000 ALTER TABLE `especialidades` DISABLE KEYS */;
INSERT INTO `especialidades` VALUES (1,'Ortopedia','Coluna'),(2,'Reumatologia','Osteoporose'),(3,'Fisiatria','Neurorreabilitação');
/*!40000 ALTER TABLE `especialidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especialidades_medico`
--

DROP TABLE IF EXISTS `especialidades_medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especialidades_medico` (
  `medico` int NOT NULL,
  `especialidade` int NOT NULL,
  PRIMARY KEY (`medico`,`especialidade`),
  KEY `especialidade` (`especialidade`),
  CONSTRAINT `especialidades_medico_ibfk_1` FOREIGN KEY (`medico`) REFERENCES `perfis` (`id_perfil`),
  CONSTRAINT `especialidades_medico_ibfk_2` FOREIGN KEY (`especialidade`) REFERENCES `especialidades` (`id_especialidade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especialidades_medico`
--

LOCK TABLES `especialidades_medico` WRITE;
/*!40000 ALTER TABLE `especialidades_medico` DISABLE KEYS */;
INSERT INTO `especialidades_medico` VALUES (3,1),(5,2);
/*!40000 ALTER TABLE `especialidades_medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listas_espera`
--

DROP TABLE IF EXISTS `listas_espera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listas_espera` (
  `id_lista_espera` int NOT NULL AUTO_INCREMENT,
  `consulta` int NOT NULL,
  `paciente` int NOT NULL,
  `posicao_lista_espera` int DEFAULT NULL,
  `status_lista_espera` enum('Ativa','Desativada') DEFAULT NULL,
  PRIMARY KEY (`id_lista_espera`),
  KEY `consulta` (`consulta`),
  KEY `paciente` (`paciente`),
  CONSTRAINT `listas_espera_ibfk_1` FOREIGN KEY (`consulta`) REFERENCES `consultas` (`id_consulta`),
  CONSTRAINT `listas_espera_ibfk_2` FOREIGN KEY (`paciente`) REFERENCES `perfis` (`id_perfil`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listas_espera`
--

LOCK TABLES `listas_espera` WRITE;
/*!40000 ALTER TABLE `listas_espera` DISABLE KEYS */;
INSERT INTO `listas_espera` VALUES (7,12,1,NULL,'Desativada'),(8,12,1,NULL,'Desativada'),(9,12,4,NULL,'Desativada'),(10,19,1,NULL,'Ativa'),(11,19,6,NULL,'Ativa');
/*!40000 ALTER TABLE `listas_espera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfis`
--

DROP TABLE IF EXISTS `perfis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfis` (
  `id_perfil` int NOT NULL AUTO_INCREMENT,
  `tipo_perfil` enum('Medico','Paciente','Recepcionista') DEFAULT NULL,
  `usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_perfil`),
  KEY `usuario` (`usuario`),
  CONSTRAINT `perfis_ibfk_1` FOREIGN KEY (`usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfis`
--

LOCK TABLES `perfis` WRITE;
/*!40000 ALTER TABLE `perfis` DISABLE KEYS */;
INSERT INTO `perfis` VALUES (1,'Paciente',1),(2,'Paciente',2),(3,'Medico',3),(4,'Paciente',5),(5,'Medico',6),(6,'Paciente',7);
/*!40000 ALTER TABLE `perfis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome_usuario` varchar(100) DEFAULT NULL,
  `sobrenome_usuario` varchar(100) DEFAULT NULL,
  `data_nascimento_usuario` datetime DEFAULT NULL,
  `cpf_usuario` char(11) DEFAULT NULL,
  `email_usuario` varchar(100) DEFAULT NULL,
  `senha_usuario` varchar(100) DEFAULT NULL,
  `status_usuario` enum('Ativo','Desativado') DEFAULT NULL,
  `sexo_usuario` enum('Masculino','Feminino') DEFAULT NULL,
  `adm_usuario` tinyint(1) DEFAULT NULL,
  `crm_usuario` varchar(13) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Fernando','Sadoc','1997-03-17 00:00:00','12345678901','fernando@email.com','12345','Ativo','Masculino',0,NULL),(2,'Wiliam','Ferreira','1997-01-01 00:00:00','10987657321','wiliam@email.com','54321','Desativado','Masculino',0,NULL),(3,'José','Silva Santos','1960-02-03 00:00:00','33987657321','jose@email.com','54321','Ativo','Masculino',0,'123456-SP'),(4,'Administrador','1','1993-08-01 00:00:00','12345678911','adm1@email.com','12345','Ativo','Masculino',1,NULL),(5,'Usuario','Primeiro','2002-02-02 00:00:00','15428364879','user1@email.com','12345','Ativo','Feminino',0,NULL),(6,'Medico','1','1966-06-06 00:00:00','36458852711','med1@email.com','12345','Ativo','Masculino',0,'SP12345'),(7,'Charles','Gomez ','1990-09-18 00:00:00','56483678090','charlesgomez@email.com','123456','Ativo','Feminino',0,NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-15 21:23:19
