# Banco de dados — Sistema de Cadastro de Alunos

SGBD: **MySQL 8.0** · Banco: `sistema_alunos`

## Como criar

Rode os scripts nesta ordem (MySQL Workbench ou terminal):

```bash
mysql -u root -p < 01_schema.sql
mysql -u root -p < 02_regras.sql
mysql -u root -p < 03_dados.sql
```

`04_consultas_exemplo.sql` traz consultas de CRUD e relatórios para a apresentação.

## Tabelas

| Tabela | Para que serve |
|---|---|
| `funcionario` | Secretaria, professores, coordenação, administradores |
| `aluno` | Dados pessoais e endereço do aluno |
| `curso` | Cursos oferecidos |
| `disciplina` | Disciplinas de cada curso |
| `matricula` | Aluno matriculado em um curso (N:N) |
| `nota` | Notas A1/A2/A3 por disciplina |
| `historico_academico` | Linha do tempo da situação do aluno (gerada por trigger) |
| `usuario` | Login e hash da senha (aluno ou funcionário) |
| `log_acesso` | Auditoria de todas as tentativas de login |

## Regras de negócio no banco

- CPF com 11 dígitos, único; e-mail e RA únicos.
- Nota entre 0 e 10; uma nota por avaliação (A1/A2/A3) por disciplina.
- Só lança nota se o aluno está matriculado no curso **e** a disciplina é desse curso (FKs compostas).
- Só lança nota com matrícula `ATIVA` (trigger).
- Toda matrícula e mudança de status gera histórico automaticamente (trigger).
- Usuário pertence a um aluno **ou** a um funcionário, conforme o perfil (trigger).
- Login (`sp_registrar_login`): 3 senhas erradas seguidas bloqueiam por 15 minutos; usuário inativo não entra; tudo fica em `log_acesso`.
- Senha guardada só como hash BCrypt — a aplicação confere a senha e chama a procedure.
- Excluir um aluno remove em cascata matrícula, notas, histórico e usuário.

## Usuários de teste

Senha de todos: `Senha@123`

| Login | Perfil |
|---|---|
| `carla.mendes@faculdade.edu.br` | Funcionário (administradora) |
| `juliana.prado@faculdade.edu.br` | Funcionário (professora) |
| `2026000001` … `2026000005` | Alunos (login = RA) |
| `2026000006` | Aluno **inativo** (para testar login negado) |
