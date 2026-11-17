-- =====================================================================
-- A3 - Sistema de Cadastro de Alunos (com login)
-- UCs: Banco de Dados / Garantia e Qualidade de Software
-- SGBD: MySQL 8.0
-- Arquivo 1/3: criação do banco e das tabelas
-- =====================================================================

DROP DATABASE IF EXISTS sistema_alunos;
CREATE DATABASE sistema_alunos
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE sistema_alunos;

-- ---------------------------------------------------------------------
-- FUNCIONARIO: secretaria, professores, coordenação e administradores
-- ---------------------------------------------------------------------
CREATE TABLE funcionario (
  id_funcionario INT          NOT NULL AUTO_INCREMENT,
  nome           VARCHAR(100) NOT NULL,
  cpf            CHAR(11)     NOT NULL,
  email          VARCHAR(100) NOT NULL,
  cargo          ENUM('SECRETARIA','PROFESSOR','COORDENADOR','ADMINISTRADOR') NOT NULL,
  data_admissao  DATE         NOT NULL,
  ativo          BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_funcionario       PRIMARY KEY (id_funcionario),
  CONSTRAINT uq_funcionario_cpf   UNIQUE (cpf),
  CONSTRAINT uq_funcionario_email UNIQUE (email),
  CONSTRAINT ck_funcionario_cpf   CHECK (REGEXP_LIKE(cpf, '^[0-9]{11}$'))
);

-- ---------------------------------------------------------------------
-- ALUNO: dados pessoais e endereço
-- ---------------------------------------------------------------------
CREATE TABLE aluno (
  id_aluno        INT          NOT NULL AUTO_INCREMENT,
  ra              CHAR(10)     NOT NULL,           -- Registro Acadêmico
  nome            VARCHAR(100) NOT NULL,
  cpf             CHAR(11)     NOT NULL,
  email           VARCHAR(100) NOT NULL,
  telefone        VARCHAR(15)  NULL,
  data_nascimento DATE         NULL,
  logradouro      VARCHAR(120) NULL,
  numero          VARCHAR(10)  NULL,
  bairro          VARCHAR(60)  NULL,
  cidade          VARCHAR(60)  NULL,
  uf              CHAR(2)      NULL,
  cep             CHAR(8)      NULL,
  data_cadastro   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_aluno       PRIMARY KEY (id_aluno),
  CONSTRAINT uq_aluno_ra    UNIQUE (ra),
  CONSTRAINT uq_aluno_cpf   UNIQUE (cpf),
  CONSTRAINT uq_aluno_email UNIQUE (email),
  CONSTRAINT ck_aluno_cpf   CHECK (REGEXP_LIKE(cpf, '^[0-9]{11}$')),
  CONSTRAINT ck_aluno_cep   CHECK (cep IS NULL OR REGEXP_LIKE(cep, '^[0-9]{8}$')),
  CONSTRAINT ck_aluno_uf    CHECK (uf  IS NULL OR REGEXP_LIKE(uf,  '^[A-Z]{2}$'))
);

-- ---------------------------------------------------------------------
-- CURSO
-- ---------------------------------------------------------------------
CREATE TABLE curso (
  id_curso           INT          NOT NULL AUTO_INCREMENT,
  nome               VARCHAR(100) NOT NULL,
  categoria          ENUM('BACHARELADO','LICENCIATURA','TECNOLOGO','POS_GRADUACAO') NOT NULL,
  duracao_semestres  TINYINT      NOT NULL,
  status             ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  CONSTRAINT pk_curso         PRIMARY KEY (id_curso),
  CONSTRAINT uq_curso_nome    UNIQUE (nome),
  CONSTRAINT ck_curso_duracao CHECK (duracao_semestres BETWEEN 1 AND 12)
);

-- ---------------------------------------------------------------------
-- DISCIPLINA: cada disciplina pertence a um curso
-- ---------------------------------------------------------------------
CREATE TABLE disciplina (
  id_disciplina  INT          NOT NULL AUTO_INCREMENT,
  id_curso       INT          NOT NULL,
  nome           VARCHAR(100) NOT NULL,
  carga_horaria  SMALLINT     NOT NULL,
  semestre       TINYINT      NOT NULL,
  CONSTRAINT pk_disciplina          PRIMARY KEY (id_disciplina),
  CONSTRAINT uq_disciplina_nome     UNIQUE (id_curso, nome),
  CONSTRAINT uq_disciplina_curso    UNIQUE (id_disciplina, id_curso),  -- usado pela FK composta de NOTA
  CONSTRAINT fk_disciplina_curso    FOREIGN KEY (id_curso) REFERENCES curso (id_curso) ON DELETE CASCADE,
  CONSTRAINT ck_disciplina_ch       CHECK (carga_horaria > 0),
  CONSTRAINT ck_disciplina_semestre CHECK (semestre BETWEEN 1 AND 12)
);

-- ---------------------------------------------------------------------
-- MATRICULA: associa o aluno a um curso (relação N:N aluno x curso)
-- ---------------------------------------------------------------------
CREATE TABLE matricula (
  id_matricula    INT  NOT NULL AUTO_INCREMENT,
  id_aluno        INT  NOT NULL,
  id_curso        INT  NOT NULL,
  data_matricula  DATE NOT NULL DEFAULT (CURRENT_DATE),
  status          ENUM('ATIVA','TRANCADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ATIVA',
  CONSTRAINT pk_matricula       PRIMARY KEY (id_matricula),
  CONSTRAINT uq_matricula       UNIQUE (id_aluno, id_curso),
  CONSTRAINT fk_matricula_aluno FOREIGN KEY (id_aluno) REFERENCES aluno (id_aluno) ON DELETE CASCADE,
  CONSTRAINT fk_matricula_curso FOREIGN KEY (id_curso) REFERENCES curso (id_curso) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- NOTA: avaliações A1, A2 e A3 de um aluno em uma disciplina do seu curso
-- As FKs compostas garantem que:
--   * o aluno está matriculado no curso; e
--   * a disciplina pertence a esse mesmo curso.
-- ---------------------------------------------------------------------
CREATE TABLE nota (
  id_nota          INT          NOT NULL AUTO_INCREMENT,
  id_aluno         INT          NOT NULL,
  id_curso         INT          NOT NULL,
  id_disciplina    INT          NOT NULL,
  avaliacao        ENUM('A1','A2','A3') NOT NULL,
  nota             DECIMAL(4,2) NOT NULL,
  data_lancamento  DATE         NOT NULL DEFAULT (CURRENT_DATE),
  id_funcionario   INT          NULL,      -- quem lançou a nota
  CONSTRAINT pk_nota             PRIMARY KEY (id_nota),
  CONSTRAINT uq_nota             UNIQUE (id_aluno, id_disciplina, avaliacao),
  CONSTRAINT fk_nota_matricula   FOREIGN KEY (id_aluno, id_curso)
                                 REFERENCES matricula (id_aluno, id_curso) ON DELETE CASCADE,
  CONSTRAINT fk_nota_disciplina  FOREIGN KEY (id_disciplina, id_curso)
                                 REFERENCES disciplina (id_disciplina, id_curso) ON DELETE CASCADE,
  CONSTRAINT fk_nota_funcionario FOREIGN KEY (id_funcionario)
                                 REFERENCES funcionario (id_funcionario) ON DELETE SET NULL,
  CONSTRAINT ck_nota_valor       CHECK (nota BETWEEN 0 AND 10)
);

-- ---------------------------------------------------------------------
-- HISTORICO_ACADEMICO: linha do tempo da situação do aluno no curso
-- (preenchido automaticamente por triggers em MATRICULA)
-- ---------------------------------------------------------------------
CREATE TABLE historico_academico (
  id_historico  INT          NOT NULL AUTO_INCREMENT,
  id_aluno      INT          NOT NULL,
  id_curso      INT          NOT NULL,
  data          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status        ENUM('ATIVA','TRANCADA','CONCLUIDA','CANCELADA') NOT NULL,
  observacao    VARCHAR(255) NULL,
  CONSTRAINT pk_historico           PRIMARY KEY (id_historico),
  CONSTRAINT fk_historico_matricula FOREIGN KEY (id_aluno, id_curso)
                                    REFERENCES matricula (id_aluno, id_curso) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- USUARIO: credenciais de acesso ao sistema (login)
-- Um usuário é de um aluno OU de um funcionário (regra garantida por trigger).
-- A senha nunca é guardada em texto puro: apenas o hash BCrypt (60 caracteres).
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
  id_usuario         INT          NOT NULL AUTO_INCREMENT,
  login              VARCHAR(100) NOT NULL,
  senha_hash         CHAR(60)     NOT NULL,
  perfil             ENUM('ALUNO','FUNCIONARIO') NOT NULL,
  id_aluno           INT          NULL,
  id_funcionario     INT          NULL,
  ativo              BOOLEAN      NOT NULL DEFAULT TRUE,
  tentativas_falhas  TINYINT      NOT NULL DEFAULT 0,
  bloqueado_ate      DATETIME     NULL,
  ultimo_acesso      DATETIME     NULL,
  criado_em          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario             PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuario_login       UNIQUE (login),
  CONSTRAINT uq_usuario_aluno       UNIQUE (id_aluno),
  CONSTRAINT uq_usuario_funcionario UNIQUE (id_funcionario),
  CONSTRAINT fk_usuario_aluno       FOREIGN KEY (id_aluno)
                                    REFERENCES aluno (id_aluno) ON DELETE CASCADE,
  CONSTRAINT fk_usuario_funcionario FOREIGN KEY (id_funcionario)
                                    REFERENCES funcionario (id_funcionario) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- LOG_ACESSO: auditoria de todas as tentativas de login
-- ---------------------------------------------------------------------
CREATE TABLE log_acesso (
  id_log           BIGINT       NOT NULL AUTO_INCREMENT,
  id_usuario       INT          NULL,       -- NULL quando o login informado não existe
  login_informado  VARCHAR(100) NOT NULL,
  sucesso          BOOLEAN      NOT NULL,
  motivo           ENUM('OK','SENHA_INVALIDA','USUARIO_INEXISTENTE','USUARIO_BLOQUEADO','USUARIO_INATIVO') NOT NULL,
  ip               VARCHAR(45)  NULL,       -- comporta IPv4 e IPv6
  data_hora        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_log_acesso         PRIMARY KEY (id_log),
  CONSTRAINT fk_log_acesso_usuario FOREIGN KEY (id_usuario)
                                   REFERENCES usuario (id_usuario) ON DELETE SET NULL
);

-- Índices para as consultas mais frequentes
CREATE INDEX ix_aluno_nome       ON aluno (nome);
CREATE INDEX ix_log_acesso_data  ON log_acesso (data_hora);
CREATE INDEX ix_historico_aluno  ON historico_academico (id_aluno, data);
