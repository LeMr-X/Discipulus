-- =====================================================================
-- Arquivo 2/3: regras de negócio no banco (triggers, views, procedures) (Rafa: Tem que mexer atualizar aqui)
-- Rodar depois de 01_schema.sql
-- =====================================================================

USE sistema_alunos;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Regra: um usuário pertence a exatamente um dono, coerente com o perfil.
--   perfil ALUNO       -> id_aluno preenchido e id_funcionario vazio
--   perfil FUNCIONARIO -> id_funcionario preenchido e id_aluno vazio
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_usuario_valida_ins
BEFORE INSERT ON usuario
FOR EACH ROW
BEGIN
  IF NOT ((NEW.perfil = 'ALUNO'       AND NEW.id_aluno IS NOT NULL AND NEW.id_funcionario IS NULL)
       OR (NEW.perfil = 'FUNCIONARIO' AND NEW.id_funcionario IS NOT NULL AND NEW.id_aluno IS NULL)) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Usuario deve pertencer a um aluno OU a um funcionario, conforme o perfil';
  END IF;
END$$

CREATE TRIGGER trg_usuario_valida_upd
BEFORE UPDATE ON usuario
FOR EACH ROW
BEGIN
  IF NOT ((NEW.perfil = 'ALUNO'       AND NEW.id_aluno IS NOT NULL AND NEW.id_funcionario IS NULL)
       OR (NEW.perfil = 'FUNCIONARIO' AND NEW.id_funcionario IS NOT NULL AND NEW.id_aluno IS NULL)) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Usuario deve pertencer a um aluno OU a um funcionario, conforme o perfil';
  END IF;
END$$

-- ---------------------------------------------------------------------
-- Regra: toda matrícula nova e toda mudança de status vão para o histórico
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_matricula_historico_ins
AFTER INSERT ON matricula
FOR EACH ROW
BEGIN
  INSERT INTO historico_academico (id_aluno, id_curso, status, observacao)
  VALUES (NEW.id_aluno, NEW.id_curso, NEW.status, 'Matricula realizada');
END$$

CREATE TRIGGER trg_matricula_historico_upd
AFTER UPDATE ON matricula
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO historico_academico (id_aluno, id_curso, status, observacao)
    VALUES (NEW.id_aluno, NEW.id_curso, NEW.status,
            CONCAT('Status alterado de ', OLD.status, ' para ', NEW.status));
  END IF;
END$$

-- ---------------------------------------------------------------------
-- Regra: só é possível lançar nota para matrícula ATIVA
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_nota_matricula_ativa
BEFORE INSERT ON nota
FOR EACH ROW
BEGIN
  IF (SELECT status FROM matricula
       WHERE id_aluno = NEW.id_aluno AND id_curso = NEW.id_curso) <> 'ATIVA' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Nao e possivel lancar nota: matricula nao esta ATIVA';
  END IF;
END$$

-- ---------------------------------------------------------------------
-- Login: registra uma tentativa e aplica a regra de bloqueio. (Rafa: Mano tem que mexer aq )
-- A conferência da senha (BCrypt) é feita na aplicação; ela chama esta
-- procedure informando se a senha conferiu (p_senha_ok).
-- Regra: 3 falhas seguidas bloqueiam o usuário por 15 minutos.
-- Retorna o motivo no parâmetro de saída p_resultado.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_registrar_login (
  IN  p_login     VARCHAR(100),
  IN  p_senha_ok  BOOLEAN,
  IN  p_ip        VARCHAR(45),
  OUT p_resultado VARCHAR(30)
)
BEGIN
  DECLARE v_id        INT;
  DECLARE v_ativo     BOOLEAN;
  DECLARE v_bloqueio  DATETIME;
  DECLARE v_falhas    TINYINT;

  SELECT id_usuario, ativo, bloqueado_ate, tentativas_falhas
    INTO v_id, v_ativo, v_bloqueio, v_falhas
    FROM usuario
   WHERE login = p_login;

  IF v_id IS NULL THEN
    SET p_resultado = 'USUARIO_INEXISTENTE';
  ELSEIF NOT v_ativo THEN
    SET p_resultado = 'USUARIO_INATIVO';
  ELSEIF v_bloqueio IS NOT NULL AND v_bloqueio > NOW() THEN
    SET p_resultado = 'USUARIO_BLOQUEADO';
  ELSEIF p_senha_ok THEN
    SET p_resultado = 'OK';
    UPDATE usuario
       SET tentativas_falhas = 0, bloqueado_ate = NULL, ultimo_acesso = NOW()
     WHERE id_usuario = v_id;
  ELSE
    SET p_resultado = 'SENHA_INVALIDA';
    UPDATE usuario
       SET tentativas_falhas = IF(v_falhas + 1 >= 3, 0, v_falhas + 1),
           bloqueado_ate     = IF(v_falhas + 1 >= 3, NOW() + INTERVAL 15 MINUTE, NULL)
     WHERE id_usuario = v_id;
  END IF;

  INSERT INTO log_acesso (id_usuario, login_informado, sucesso, motivo, ip)
  VALUES (v_id, p_login, p_resultado = 'OK', p_resultado, p_ip);
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- VIEW: boletim — média das avaliações por aluno e disciplina
-- Situação: APROVADO com média >= 7 após as 3 avaliações
-- ---------------------------------------------------------------------
CREATE VIEW vw_boletim AS
SELECT a.id_aluno,
       a.ra,
       a.nome                       AS aluno,
       c.nome                       AS curso,
       d.nome                       AS disciplina,
       d.semestre,
       MAX(CASE WHEN n.avaliacao = 'A1' THEN n.nota END) AS a1,
       MAX(CASE WHEN n.avaliacao = 'A2' THEN n.nota END) AS a2,
       MAX(CASE WHEN n.avaliacao = 'A3' THEN n.nota END) AS a3,
       ROUND(AVG(n.nota), 2)        AS media,
       CASE
         WHEN COUNT(n.id_nota) < 3 THEN 'EM ANDAMENTO'
         WHEN AVG(n.nota) >= 7     THEN 'APROVADO'
         ELSE 'REPROVADO'
       END                          AS situacao
  FROM nota n
  JOIN aluno      a ON a.id_aluno      = n.id_aluno
  JOIN curso      c ON c.id_curso      = n.id_curso
  JOIN disciplina d ON d.id_disciplina = n.id_disciplina
 GROUP BY a.id_aluno, a.ra, a.nome, c.nome, d.nome, d.semestre;

-- ---------------------------------------------------------------------
-- VIEW: dados do usuário logado (sem expor o hash da senha)
-- ---------------------------------------------------------------------
CREATE VIEW vw_usuario_perfil AS
SELECT u.id_usuario,
       u.login,
       u.perfil,
       COALESCE(a.nome, f.nome) AS nome,
       a.ra,
       f.cargo,
       u.ativo,
       u.bloqueado_ate,
       u.ultimo_acesso
  FROM usuario u
  LEFT JOIN aluno       a ON a.id_aluno       = u.id_aluno
  LEFT JOIN funcionario f ON f.id_funcionario = u.id_funcionario;
