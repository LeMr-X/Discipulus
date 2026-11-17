# Discipulus — Back-end

API em Node.js + Express + TypeScript que conecta o front-end ao MySQL (`sistema_alunos`).

## Rodar

1. Crie o banco rodando os scripts `database/01_schema.sql`, `02_regras.sql` e `03_dados.sql`.
2. Copie `.env.example` para `.env` e preencha a senha do seu MySQL e um `JWT_SECRET`.
3. Instale e suba a API:

```bash
npm install
npm run dev
```

A API sobe em http://localhost:3333. Confira em http://localhost:3333/api/saude, que deve mostrar `{"api":"ok","banco":"ok"}`.

Com a API no ar, rode o front-end (`cd ../frontend && npm run dev`): ele repassa as chamadas `/api` para cá.

## Rotas

Todas, menos `saude` e `login`, exigem o token no cabeçalho `Authorization: Bearer ...`.

| Método | Rota | Quem pode | O que faz |
|---|---|---|---|
| GET | `/api/saude` | livre | Confere se a API e o banco respondem |
| POST | `/api/auth/login` | livre | Login com `{ login, senha }`. Devolve o usuário e um token |
| GET | `/api/auth/eu` | logado | Dados da sessão do token |
| GET | `/api/alunos/:id/painel` | o próprio aluno ou funcionário | Boletim, dados e histórico |
| GET | `/api/alunos?busca=` | funcionário | Lista alunos (busca por nome, RA, CPF ou e-mail) |
| GET | `/api/alunos/:id` | funcionário | Detalhe: dados, matrículas e acesso |
| POST | `/api/alunos` | cadastros | Cadastra aluno: gera o RA, cria a matrícula e o login |
| PUT | `/api/alunos/:id` | cadastros | Atualiza dados pessoais |
| DELETE | `/api/alunos/:id` | cadastros | Exclui (em cascata: matrículas, notas, histórico, login) |
| POST | `/api/alunos/:id/matriculas` | cadastros | Matricula em outro curso `{ idCurso }` |
| PATCH | `/api/alunos/:id/matriculas/:idMatricula` | cadastros | Muda a situação `{ status }` (vai para o histórico) |
| PATCH | `/api/alunos/:id/acesso` | cadastros | Ativa/desativa o login `{ ativo }` (ativar também desbloqueia) |
| GET | `/api/cursos` | funcionário | Lista cursos com contagem de disciplinas e matrículas |
| POST / PUT / DELETE | `/api/cursos[/:id]` | cadastros | CRUD de curso |
| GET / POST | `/api/cursos/:id/disciplinas` | funcionário / cadastros | Lista e cria disciplinas |
| PUT / DELETE | `/api/disciplinas/:id` | cadastros | Edita e exclui disciplina |
| GET | `/api/disciplinas/:id/notas` | notas | Planilha da turma (A1, A2, A3) |
| PUT | `/api/disciplinas/:id/notas` | notas | Lança, corrige (`nota`) ou apaga (`nota: null`) uma nota |

### Permissões por cargo

| Permissão | Secretaria | Professor | Coordenação | Administração |
|---|:-:|:-:|:-:|:-:|
| consultar alunos e cursos | ✓ | ✓ | ✓ | ✓ |
| cadastros (alunos, cursos, disciplinas) | ✓ | | ✓ | ✓ |
| notas | | ✓ | ✓ | ✓ |

### Regras de negócio

- RA gerado automaticamente: ano + sequência (`2026000007`), dentro de uma transação.
- Cadastro de aluno cria aluno, matrícula e login juntos; se algo falha, nada é gravado.
- Só matricula em curso **ativo**.
- Disciplina não pode ficar num semestre depois do fim do curso, e o curso não pode ser encurtado se tiver disciplinas nos semestres finais.
- Curso com matrículas não pode ser excluído (deve ser marcado como inativo).
- Disciplina com notas lançadas não pode ser excluída.
- Nota de 0 a 10 com até 2 casas; só para matrícula **ativa** (trigger do banco).
- Erros do MySQL (CPF duplicado, trigger, etc.) viram mensagens claras (`src/erros.ts`).

Respostas do login:

| HTTP | `motivo` | Quando |
|---|---|---|
| 200 | — | Login certo (`ok: true`, `usuario`, `token`) |
| 401 | `SENHA_INVALIDA` | Senha errada (traz `tentativasRestantes`) |
| 401 | `USUARIO_INEXISTENTE` | Login não existe |
| 403 | `USUARIO_INATIVO` | Usuário desativado |
| 423 | `USUARIO_BLOQUEADO` | 3 senhas erradas seguidas (traz `bloqueadoAte`) |
| 400 | — | Login ou senha não informados |

## Como o login funciona

1. A API busca o hash da senha em `usuario` e confere com **BCrypt**. Se o login não existe, confere com um hash falso, para a resposta demorar o mesmo tempo e não revelar quais logins existem.
2. Chama a procedure **`sp_registrar_login`**, que decide o resultado (ativo, bloqueio, contagem de falhas) e grava em `log_acesso`.
3. Se deu certo, gera um **token JWT** (válido por 2 h) com id, perfil e id do aluno. O front manda esse token no cabeçalho `Authorization: Bearer ...`.

## Estrutura

```
src/
  app.ts                 rotas HTTP e validação (zod)
  server.ts              liga as peças e sobe o servidor
  config.ts              lê o .env
  db.ts                  conexão com o MySQL
  auth/
    authService.ts       regras do login
    authRepository.ts    SQL do login (procedure, usuário)
    token.ts             gera e confere o JWT
  alunos/
    painelService.ts     regra de quem pode ver qual painel
    painelRepository.ts  SQL do painel (vw_boletim, histórico)
    alunosRepository.ts  SQL do cadastro de alunos
  cursos/                SQL de cursos e disciplinas
  notas/                 SQL do lançamento de notas
  rotas/                 rotas da área do funcionário
  permissoes.ts          o que cada cargo pode fazer
  regras.ts              regras de negócio (funções puras)
  validacao.ts           validação dos formulários (zod)
  erros.ts               erros HTTP e tradução dos erros do MySQL
tests/                   testes automatizados (Vitest)
```

Os serviços recebem o repositório como parâmetro. Assim os testes usam um repositório em memória (`tests/fakes.ts`) e não precisam do banco.

## Testes

```bash
npm test          # testes unitários e de API (sem banco)
npm run coverage  # o mesmo, com relatório de cobertura em coverage/
```

Os testes de integração com o MySQL real (`tests/mysql.integration.test.ts`) só rodam com `DB_TESTE=1`:

```bash
DB_TESTE=1 DB_PASSWORD=suasenha npm test
```

O relatório `coverage/lcov.info` é o formato que o SonarCloud lê.
