-- =====================================================================
-- Consultas de exemplo (CRUD e relatórios) — úteis na apresentação
-- =====================================================================

USE sistema_alunos;

-- READ: boletim de um aluno
SELECT * FROM vw_boletim WHERE ra = '2026000001';

-- READ: histórico acadêmico de um aluno
SELECT h.data, c.nome AS curso, h.status, h.observacao
  FROM historico_academico h
  JOIN curso c ON c.id_curso = h.id_curso
 WHERE h.id_aluno = 6
 ORDER BY h.data;

-- READ: buscar usuário para login (a aplicação confere a senha com BCrypt)
SELECT id_usuario, login, senha_hash, perfil, ativo, bloqueado_ate
  FROM usuario
 WHERE login = '2026000001';

-- LOGIN: registrar tentativa (TRUE = senha conferiu na aplicação)
CALL sp_registrar_login('2026000003', FALSE, '127.0.0.1', @resultado);
SELECT @resultado;

-- RELATÓRIO: quantidade de alunos por curso e situação
SELECT c.nome AS curso, m.status, COUNT(*) AS total
  FROM matricula m
  JOIN curso c ON c.id_curso = m.id_curso
 GROUP BY c.nome, m.status
 ORDER BY c.nome;

-- RELATÓRIO: média geral por disciplina
SELECT curso, disciplina, ROUND(AVG(media), 2) AS media_turma
  FROM vw_boletim
 GROUP BY curso, disciplina;

-- RELATÓRIO: últimas tentativas de login
SELECT data_hora, login_informado, sucesso, motivo, ip
  FROM log_acesso
 ORDER BY data_hora DESC
 LIMIT 20;

-- UPDATE: atualizar telefone de um aluno
UPDATE aluno SET telefone = '48988887777' WHERE ra = '2026000004';

-- UPDATE: corrigir nota
UPDATE nota SET nota = 7.50
 WHERE id_aluno = 4 AND id_disciplina = 5 AND avaliacao = 'A2';

-- DELETE: excluir um aluno (remove em cascata matrícula, notas, histórico e usuário)
-- DELETE FROM aluno WHERE ra = '2026000006';
