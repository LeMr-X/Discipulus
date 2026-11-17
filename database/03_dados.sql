-- =====================================================================
-- Arquivo 3/3: dados de exemplo (para testes e apresentação)
-- Rodar depois de 01_schema.sql e 02_regras.sql
--
-- Todos os usuários de teste usam a senha: Senha@123
-- (hash BCrypt custo 10, compatível com jBCrypt / Spring Security)
-- =====================================================================

USE sistema_alunos;

SET @hash = '$2a$10$GHxXN0w.wxONTX32KCFh2eSUGQWnwRwbFnWvafdmyMFF.wU2ChzwC';

-- Funcionários ---------------------------------------------------------
INSERT INTO funcionario (nome, cpf, email, cargo, data_admissao) VALUES
  ('Carla Mendes',     '11122233344', 'carla.mendes@faculdade.edu.br',   'ADMINISTRADOR', '2020-02-01'),
  ('Roberto Lima',     '22233344455', 'roberto.lima@faculdade.edu.br',   'SECRETARIA',    '2021-03-15'),
  ('Juliana Prado',    '33344455566', 'juliana.prado@faculdade.edu.br',  'PROFESSOR',     '2019-08-01'),
  ('Marcos Oliveira',  '44455566677', 'marcos.oliveira@faculdade.edu.br','COORDENADOR',   '2018-01-10');

-- Cursos ---------------------------------------------------------------
INSERT INTO curso (nome, categoria, duracao_semestres, status) VALUES
  ('Ciência da Computação',           'BACHARELADO',  8, 'ATIVO'),
  ('Análise e Desenvolvimento de Sistemas', 'TECNOLOGO', 5, 'ATIVO'),
  ('Sistemas de Informação',          'BACHARELADO',  8, 'INATIVO');

-- Disciplinas ----------------------------------------------------------
INSERT INTO disciplina (id_curso, nome, carga_horaria, semestre) VALUES
  (1, 'Algoritmos e Programação',          80, 1),
  (1, 'Banco de Dados',                    80, 3),
  (1, 'Garantia e Qualidade de Software',  80, 5),
  (2, 'Lógica de Programação',             60, 1),
  (2, 'Modelagem de Banco de Dados',       60, 2),
  (2, 'Testes de Software',                60, 4),
  (3, 'Fundamentos de SI',                 60, 1);

-- Alunos ---------------------------------------------------------------
INSERT INTO aluno (ra, nome, cpf, email, telefone, data_nascimento,
                   logradouro, numero, bairro, cidade, uf, cep) VALUES
  ('2026000001', 'Ana Souza',       '12345678901', 'ana.souza@aluno.edu.br',     '48999990001', '2004-05-12',
   'Rua das Flores', '120', 'Centro',      'Florianópolis', 'SC', '88010000'),
  ('2026000002', 'Bruno Costa',     '23456789012', 'bruno.costa@aluno.edu.br',   '48999990002', '2003-11-03',
   'Av. Beira Mar', '455', 'Agronômica',  'Florianópolis', 'SC', '88025000'),
  ('2026000003', 'Camila Ferreira', '34567890123', 'camila.ferreira@aluno.edu.br','48999990003', '2005-01-27',
   'Rua João Pinto', '33', 'Centro',      'Palhoça',       'SC', '88130000'),
  ('2026000004', 'Diego Martins',   '45678901234', 'diego.martins@aluno.edu.br', '48999990004', '2002-07-19',
   'Rua Pedra Branca', '900', 'Pedra Branca', 'Palhoça',  'SC', '88137000'),
  ('2026000005', 'Eduarda Rocha',   '56789012345', 'eduarda.rocha@aluno.edu.br', '48999990005', '2004-09-08',
   'Rua Koesa', '78', 'Kobrasol',         'São José',      'SC', '88102000'),
  ('2026000006', 'Felipe Almeida',  '67890123456', 'felipe.almeida@aluno.edu.br', NULL,         '2001-12-30',
   NULL, NULL, NULL, 'Tubarão', 'SC', NULL);

-- Matrículas (os triggers geram o histórico automaticamente) -------------
INSERT INTO matricula (id_aluno, id_curso, data_matricula, status) VALUES
  (1, 1, '2026-02-10', 'ATIVA'),
  (2, 1, '2026-02-10', 'ATIVA'),
  (3, 2, '2026-02-12', 'ATIVA'),
  (4, 2, '2026-02-12', 'ATIVA'),
  (5, 1, '2026-02-15', 'ATIVA'),
  (6, 3, '2025-02-15', 'ATIVA');

-- Notas (lançadas pela professora Juliana, id_funcionario = 3) ----------
INSERT INTO nota (id_aluno, id_curso, id_disciplina, avaliacao, nota, data_lancamento, id_funcionario) VALUES
  -- Ana: Banco de Dados (aprovada) e Qualidade (em andamento)
  (1, 1, 2, 'A1', 8.50, '2026-04-10', 3),
  (1, 1, 2, 'A2', 7.00, '2026-06-05', 3),
  (1, 1, 2, 'A3', 9.00, '2026-06-30', 3),
  (1, 1, 3, 'A1', 6.50, '2026-04-12', 3),
  -- Bruno: Banco de Dados (reprovado)
  (2, 1, 2, 'A1', 5.00, '2026-04-10', 3),
  (2, 1, 2, 'A2', 6.00, '2026-06-05', 3),
  (2, 1, 2, 'A3', 4.50, '2026-06-30', 3),
  -- Camila: Lógica de Programação (aprovada)
  (3, 2, 4, 'A1', 9.50, '2026-04-11', 3),
  (3, 2, 4, 'A2', 8.00, '2026-06-06', 3),
  (3, 2, 4, 'A3', 10.00,'2026-07-01', 3),
  -- Diego: Modelagem de BD (em andamento)
  (4, 2, 5, 'A1', 7.50, '2026-04-11', 3),
  (4, 2, 5, 'A2', 6.00, '2026-06-06', 3),
  -- Eduarda: Algoritmos (aprovada)
  (5, 1, 1, 'A1', 7.00, '2026-04-09', 3),
  (5, 1, 1, 'A2', 7.50, '2026-06-04', 3),
  (5, 1, 1, 'A3', 8.00, '2026-06-29', 3);

-- Mudanças de situação (também geram histórico via trigger) --------------
UPDATE matricula SET status = 'TRANCADA'  WHERE id_aluno = 6 AND id_curso = 3;

-- Usuários de login ----------------------------------------------------
INSERT INTO usuario (login, senha_hash, perfil, id_funcionario) VALUES
  ('carla.mendes@faculdade.edu.br',  @hash, 'FUNCIONARIO', 1),
  ('roberto.lima@faculdade.edu.br',  @hash, 'FUNCIONARIO', 2),
  ('juliana.prado@faculdade.edu.br', @hash, 'FUNCIONARIO', 3),
  ('marcos.oliveira@faculdade.edu.br', @hash, 'FUNCIONARIO', 4);

INSERT INTO usuario (login, senha_hash, perfil, id_aluno, ativo) VALUES
  ('2026000001', @hash, 'ALUNO', 1, TRUE),
  ('2026000002', @hash, 'ALUNO', 2, TRUE),
  ('2026000003', @hash, 'ALUNO', 3, TRUE),
  ('2026000004', @hash, 'ALUNO', 4, TRUE),
  ('2026000005', @hash, 'ALUNO', 5, TRUE),
  ('2026000006', @hash, 'ALUNO', 6, FALSE);   -- usuário inativo (curso trancado)

-- Algumas tentativas de login para popular a auditoria -------------------
CALL sp_registrar_login('2026000001', TRUE,  '192.168.0.10', @r);
CALL sp_registrar_login('2026000002', FALSE, '192.168.0.11', @r);
CALL sp_registrar_login('2026000002', TRUE,  '192.168.0.11', @r);
CALL sp_registrar_login('2026000006', TRUE,  '192.168.0.12', @r);
CALL sp_registrar_login('nao.existe', FALSE, '10.0.0.99',    @r);
CALL sp_registrar_login('carla.mendes@faculdade.edu.br', TRUE, '192.168.0.2', @r);
