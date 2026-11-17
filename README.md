# Discipulus

[![CI](https://github.com/LeMr-X/Discipulus/actions/workflows/ci.yml/badge.svg)](https://github.com/LeMr-X/Discipulus/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=LeMr-X_Discipulus&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=LeMr-X_Discipulus)
[![Cobertura](https://sonarcloud.io/api/project_badges/measure?project=LeMr-X_Discipulus&metric=coverage)](https://sonarcloud.io/summary/new_code?id=LeMr-X_Discipulus)
[![Licença: GPL v3](https://img.shields.io/badge/licen%C3%A7a-GPL--3.0-blue.svg)](LICENSE)

Sistema de **cadastro de alunos com login**, feito para a A3 de **Banco de Dados** e **Garantia e Qualidade de Software** (UNISUL, 2026).

- [Problema](#problema-atendido) · [Atores](#usuários-e-atores) · [Tecnologias](#tecnologias)
- [Requisitos funcionais](#requisitos-funcionais) · [Requisitos de qualidade](#requisitos-de-qualidade) · [Regras de negócio](#regras-de-negócio) · [Critérios de aceitação](#critérios-de-aceitação)
- [O que já funciona e o que está planejado](#o-que-já-funciona-e-o-que-está-planejado)
- [Instalar e executar](#instalar-e-executar) · [Testes](#testes) · [Configurações](#configurações)
- [Equipe](#equipe) · [Rastreabilidade](#rastreabilidade-requisito--implementação--teste) · [Contribuição e commits](#contribuição-e-commits)

---

## Problema atendido

Em muitas instituições pequenas, o cadastro de alunos, as matrículas e as notas ficam espalhados em planilhas. Isso causa CPF duplicado, nota fora da escala, aluno que não consegue ver o próprio boletim e nenhum controle de quem alterou o quê.

O **Discipulus** junta esses dados num banco relacional com regras de integridade e oferece:

- um **portal do aluno**, que entra com o RA e consulta boletim, dados e histórico;
- uma **área do funcionário**, que cadastra alunos, cursos e disciplinas e lança notas, com permissões por cargo;
- **login seguro**: senha só em hash BCrypt, bloqueio após 3 tentativas erradas e registro de todas as tentativas.

## Usuários e atores

| Ator | Descrição | O que pode fazer |
|---|---|---|
| **Aluno** | Estudante matriculado, entra com o RA | Ver o próprio boletim (A1, A2, A3, média, situação), dados e histórico |
| **Secretaria** | Funcionário administrativo | Cadastrar, editar e excluir alunos, cursos e disciplinas; matricular |
| **Professor** | Docente | Consultar alunos e cursos; lançar e corrigir notas |
| **Coordenação** | Coordenador de curso | Cadastros e notas |
| **Administração** | Administrador do sistema | Tudo |
| **Banco de dados (sistema)** | MySQL, com triggers e procedure | Aplica regras: bloqueio de login, histórico automático, nota só com matrícula ativa |

## Tecnologias

| Parte | Tecnologia | Pasta |
|---|---|---|
| Banco de dados | MySQL 8 (tabelas, triggers, procedure, views) | [`database/`](database/) |
| Back-end (API) | Node.js 20 + Express 5 + TypeScript, validação com zod, JWT, BCrypt | [`backend/`](backend/) |
| Front-end (site) | React 19 + TypeScript + Vite + Tailwind | [`frontend/`](frontend/) |
| Testes | Vitest + Supertest (unitários, de API e de integração com MySQL) | [`backend/tests/`](backend/tests/) |
| Qualidade | GitHub Actions (CI), cobertura V8, ESLint, SonarCloud | [`.github/workflows/`](.github/workflows/) |

## Requisitos funcionais

| ID | Requisito | Situação |
|---|---|---|
| **RF01** | O sistema deve permitir que a secretaria **cadastre um aluno** (nome, CPF, e-mail, data de nascimento, endereço e curso), gerando automaticamente o **RA**, a matrícula e o login. | ✅ Funciona |
| **RF02** | O sistema deve permitir **consultar alunos** por nome, RA, CPF ou e-mail e ver o detalhe (dados, matrículas, acesso). | ✅ Funciona |
| **RF03** | O sistema deve permitir **autenticar** aluno (RA) e funcionário (e-mail) com senha. | ✅ Funciona |
| **RF04** | O sistema deve permitir que o professor **lance, corrija e apague notas** A1, A2 e A3 por disciplina. | ✅ Funciona |
| **RF05** | O aluno deve poder **consultar o próprio boletim** com média e situação, e o histórico da matrícula. | ✅ Funciona |
| **RF06** | O sistema deve permitir **manter cursos e disciplinas** (criar, editar, excluir, inativar). | ✅ Funciona |
| **RF07** | O sistema deve permitir **editar, excluir, trancar a matrícula** e ativar/desativar o acesso de um aluno. | ✅ Funciona |
| RF08 | Emitir relatório de alunos por curso e situação em PDF. | 🕒 Planejado |

## Requisitos de qualidade

Requisitos não funcionais prioritários (ISO/IEC 25010):

| ID | Característica | Requisito | Como verificamos |
|---|---|---|---|
| **RNF01** | Segurança | Senha guardada só como hash BCrypt; bloqueio de 15 min após 3 senhas erradas; token JWT expira em 2 h; mensagens não revelam se o login existe. | Testes de `authService`, `token` e integração com a procedure |
| **RNF02** | Integridade de dados (confiabilidade) | CPF, e-mail e RA únicos; cadastro de aluno é **transacional** (aluno + matrícula + login, ou nada); excluir aluno remove em cascata. | Testes de integração com MySQL |
| **RNF03** | Manutenibilidade / testabilidade | Cobertura **≥ 75%**; quality gate do SonarCloud aprovado; serviços recebem o repositório por parâmetro (testáveis sem banco). | CI + SonarCloud |
| **RNF04** | Controle de acesso | Cada cargo só acessa o que pode (tabela de permissões); aluno só vê o próprio painel. | Testes de permissões e de rotas (403) |
| **RNF05** | Usabilidade | Mensagens de erro claras em português (ex.: "A nota vai de 0 a 10."). | Testes de validação + roteiro de validação |

## Regras de negócio

| ID | Regra | Onde está implementada |
|---|---|---|
| **RN01** | **Escala de notas:** de **0,00 a 10,00**, no máximo **2 casas decimais**, avaliações **A1, A2 e A3** (uma de cada por disciplina). | [`validacao.ts`](backend/src/validacao.ts) (API) + `CHECK` em [`01_schema.sql`](database/01_schema.sql) |
| **RN02** | **Situação:** média aritmética de A1, A2 e A3. Média **≥ 7,00 → APROVADO**, < 7,00 → REPROVADO, menos de 3 notas → EM ANDAMENTO. | View `vw_boletim` em [`02_regras.sql`](database/02_regras.sql) |
| **RN03** | Só matricula em curso **ativo** e só lança nota para matrícula **ativa**. | [`regras.ts`](backend/src/regras.ts) + trigger `trg_nota_matricula_ativa` |
| **RN04** | **3 senhas erradas seguidas** bloqueiam o login por 15 minutos; usuário inativo não entra. | [`authService.ts`](backend/src/auth/authService.ts) + procedure `sp_registrar_login` |
| RN05 | Disciplina não pode ficar num semestre depois do fim do curso; curso não pode ser encurtado se tiver disciplinas nos semestres finais. | [`regras.ts`](backend/src/regras.ts) |
| RN06 | RA gerado automaticamente: ano + sequência de 6 dígitos (ex.: `2026000007`). | [`alunosRepository.ts`](backend/src/alunos/alunosRepository.ts) |

> A regra escolhida como foco desta etapa é a **RN01 (escala de notas)**, junto com a **RN02 (aprovação)**. Os casos válidos, de limite e de rejeição estão em [docs/PLANO_DE_TESTES.md](docs/PLANO_DE_TESTES.md#rn01-escala-de-notas).

## Critérios de aceitação

| ID | Dado / Quando / Então | Requisito |
|---|---|---|
| **CA01** | **Dado** um funcionário da secretaria logado, **quando** cadastrar um aluno com dados válidos, **então** o aluno recebe um RA novo, fica matriculado e consegue entrar com o RA e a senha inicial. | RF01, RF03 |
| **CA02** | **Dado** um CPF já cadastrado, **quando** a secretaria tentar cadastrar outro aluno com ele, **então** o sistema recusa com "Já existe um aluno com este CPF." e nada é gravado. | RF01, RNF02 |
| **CA03** | **Dado** um professor logado, **quando** lançar uma nota menor que 0, maior que 10 ou com mais de 2 casas, **então** o sistema recusa com mensagem clara e a nota não é gravada. | RF04, RN01 |
| **CA04** | **Dado** um aluno com A1, A2 e A3 lançadas, **quando** a média for ≥ 7,00, **então** o boletim mostra APROVADO; se for < 7,00, REPROVADO. | RF05, RN02 |
| **CA05** | **Dado** um usuário ativo, **quando** errar a senha 3 vezes seguidas, **então** o login fica bloqueado por 15 minutos, mesmo com a senha certa. | RF03, RN04 |
| **CA06** | **Dado** um professor logado, **quando** tentar cadastrar aluno, **então** a API responde 403. **Dado** um aluno, **quando** pedir o painel de outro aluno, **então** recebe 403. | RNF04 |

## O que já funciona e o que está planejado

| Item | Situação |
|---|---|
| Banco MySQL com tabelas, triggers, procedure de login e views | ✅ Funciona |
| API com login, alunos, cursos, disciplinas e notas (RF01 a RF07) | ✅ Funciona |
| Front-end: login, portal do aluno e área do funcionário | ✅ Funciona |
| Testes unitários, de API e de integração (154 testes) | ✅ Funciona |
| Cobertura ≥ 75% com MySQL (medida localmente: ~99% das linhas) | ✅ Funciona |
| CI no GitHub Actions (testes + MySQL + cobertura + lint + build) | ✅ Configurado ([ci.yml](.github/workflows/ci.yml)) |
| SonarCloud (análise estática e quality gate) | 🔄 Configuração pronta, falta ligar o projeto e o segredo `SONAR_TOKEN` |
| Testes de sistema (ponta a ponta) com Playwright | 🕒 Planejado |
| Testes automatizados do front-end | 🕒 Planejado |
| Relatório em PDF (RF08) | 🕒 Planejado |

Cronograma detalhado: [docs/PLANO_DE_TESTES.md](docs/PLANO_DE_TESTES.md#6-cronograma).

---

## Instalar e executar

### Pré-requisitos

1. **Node.js 20 ou mais novo** (LTS): https://nodejs.org. Confira com `node -v`.
2. **MySQL Server 8**: https://dev.mysql.com/downloads/installer/. Anote a **senha do root**.
3. **Git**: https://git-scm.com.

### Primeira vez

```bash
git clone https://github.com/LeMr-X/Discipulus.git
cd Discipulus
npm run instalar      # instala back-end e front-end e cria backend/.env
```

Abra `backend/.env` e coloque a senha do seu MySQL:

```
DB_PASSWORD=sua_senha_do_mysql
```

Crie o banco com os dados de exemplo e suba o sistema:

```bash
npm run banco         # ATENÇÃO: apaga e recria o banco sistema_alunos
npm run dev           # API na porta 3333 e site na porta 5173
```

Abra **http://localhost:5173**. Para parar, use `Ctrl+C`. Das próximas vezes, basta `npm run dev`.

### Demonstração sem instalar nada

Para mostrar o sistema num computador sem Node e sem MySQL (ex.: laboratório), abra **`Discipulus-demonstracao.html`** no navegador. Os logins e as regras são os mesmos, e os dados ficam só naquele navegador.

### Contas de teste

Senha de todas: `Senha@123`.

| Login | Quem é | O que pode fazer |
|---|---|---|
| `2026000001` | Ana Souza, aluna | Ver o próprio boletim |
| `roberto.lima@faculdade.edu.br` | Secretaria | Cadastrar alunos, cursos e disciplinas |
| `juliana.prado@faculdade.edu.br` | Professora | Lançar notas |
| `carla.mendes@faculdade.edu.br` | Administração | Tudo |
| `2026000006` | Aluno inativo | Nada (testa o login recusado) |

### Comandos

| Comando (na raiz) | O que faz |
|---|---|
| `npm run instalar` | Instala as dependências e cria o `backend/.env` |
| `npm run banco` | **Apaga e recria** o banco `sistema_alunos` com os dados de exemplo |
| `npm run dev` | Sobe a API (3333) e o site (5173) |
| `npm test` | Testes unitários e de API (sem MySQL) |
| `npm run coverage` | Testes + relatório de cobertura em `backend/coverage/` |

## Testes

```bash
npm test              # unitários e de API: não precisa de MySQL
npm run coverage      # idem, com cobertura (backend/coverage/index.html)
```

**Com o MySQL** (inclui os testes de integração; é assim que o CI roda, e a meta de 75% é exigida), dentro de `backend/`:

```powershell
# Windows (PowerShell)
npm run banco
$env:DB_TESTE="1"; npm run coverage
```

```bash
# Linux / macOS / Git Bash
npm run banco
DB_TESTE=1 npm run coverage
```

Lint do front-end: `cd frontend && npm run lint`.

Plano completo, níveis de teste e cronograma: **[docs/PLANO_DE_TESTES.md](docs/PLANO_DE_TESTES.md)**.

## Configurações

Variáveis em `backend/.env` (modelo: [`backend/.env.example`](backend/.env.example)):

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3333` | Porta da API |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Endereço do MySQL |
| `DB_USER` / `DB_PASSWORD` | `root` / vazio | Usuário e senha do MySQL |
| `DB_NAME` | `sistema_alunos` | Nome do banco |
| `JWT_SECRET` | gerado pelo `instalar` | Chave que assina os tokens (obrigatória) |
| `JWT_EXPIRA_EM` | `2h` | Validade do token |
| `DB_TESTE` | não definida | `1` liga os testes de integração com MySQL |

O CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) sobe um MySQL 8 próprio. O SonarCloud é configurado em [`sonar-project.properties`](sonar-project.properties) e precisa do segredo `SONAR_TOKEN` no repositório.

### Problemas comuns

| Mensagem | O que fazer |
|---|---|
| `Usuário ou senha do MySQL incorretos` | Confira `DB_PASSWORD` em `backend/.env` |
| `Não foi possível conectar ao MySQL` | O MySQL está rodando? No Windows: Serviços → MySQL80 → Iniciar |
| `Rode primeiro: npm run instalar` | Faltam as dependências: rode `npm run instalar` |
| Porta 3333 ou 5173 em uso | Feche outro terminal que esteja com o sistema aberto |
| Site abre, mas o login dá "Não foi possível conectar" | A API não subiu: veja as linhas `[api]` no terminal |

---

## Equipe

| Integrante | Usuário no GitHub | Responsabilidades |
|---|---|---|
| **Wesley Costa** | [@LeMr-X](https://github.com/LeMr-X) | Banco de dados (modelagem, scripts SQL, triggers, procedure de login), módulo de autenticação (`auth`), testes de login/integração com banco e convenção de commits |
| **Eduardo Araujo Pires** | [@Eduardo-Arjp](https://github.com/Eduardo-Arjp) | Back-end (regras de negócio, validações, rotas de alunos, cursos e notas), testes unitários das regras de negócio/escala de notas e documentação de requisitos |
| **Rafael Fernandes Guedes Mota** | [@guedesmota23-create](https://github.com/guedesmota23-create) | Front-end (React: login, painel do aluno e área do funcionário), testes de API e de integração do fluxo de funcionários, CI (GitHub Actions), SonarCloud e plano de testes |

## Rastreabilidade: requisito → implementação → teste

| Integrante | Funcionalidade / requisito | Implementação | Arquivo de teste |
|---|---|---|---|
| **Wesley Costa** ([@LeMr-X](https://github.com/LeMr-X)) | RF03 / RN04: autenticação, hash BCrypt, JWT e bloqueio após 3 falhas | [`02_regras.sql`](database/02_regras.sql) (`sp_registrar_login`), [`authService.ts`](backend/src/auth/authService.ts), [`token.ts`](backend/src/auth/token.ts) | [`authService.test.ts`](backend/tests/authService.test.ts), [`token.test.ts`](backend/tests/token.test.ts), [`mysql.integration.test.ts`](backend/tests/mysql.integration.test.ts) |
| **Wesley Costa** ([@LeMr-X](https://github.com/LeMr-X)) | RNF02: criação automatizada do schema, triggers e seed do banco | [`01_schema.sql`](database/01_schema.sql), [`criarBanco.ts`](backend/scripts/criarBanco.ts), [`config.ts`](backend/src/config.ts) | [`criarBanco.test.ts`](backend/tests/criarBanco.test.ts), [`config.test.ts`](backend/tests/config.test.ts) |
| **Eduardo Araujo Pires** ([@Eduardo-Arjp](https://github.com/Eduardo-Arjp)) | RN01: escala de notas (0,00 a 10,00, até 2 casas, A1/A2/A3) e validação de dados | [`validacao.ts`](backend/src/validacao.ts), [`01_schema.sql`](database/01_schema.sql) (`ck_nota_valor`) | [`escalaNotas.test.ts`](backend/tests/escalaNotas.test.ts), [`validacao.test.ts`](backend/tests/validacao.test.ts) |
| **Eduardo Araujo Pires** ([@Eduardo-Arjp](https://github.com/Eduardo-Arjp)) | RN02 / RN03 / RN05 / RN06: aprovação (média ≥ 7), curso ativo, semestres e geração de RA | [`regras.ts`](backend/src/regras.ts), [`02_regras.sql`](database/02_regras.sql) (`vw_boletim`), [`painelService.ts`](backend/src/alunos/painelService.ts) | [`regras.test.ts`](backend/tests/regras.test.ts), [`painelService.test.ts`](backend/tests/painelService.test.ts), [`mysql.situacao.integration.test.ts`](backend/tests/mysql.situacao.integration.test.ts) |
| **Rafael Fernandes Guedes Mota** ([@guedesmota23-create](https://github.com/guedesmota23-create)) | RF01 / RF02 / RF07: fluxo executável de cadastro, consulta, matrícula e histórico de alunos | [`rotas/alunos.ts`](backend/src/rotas/alunos.ts), [`alunosRepository.ts`](backend/src/alunos/alunosRepository.ts), [`Alunos.tsx`](frontend/src/pages/funcionario/Alunos.tsx), [`AlunoForm.tsx`](frontend/src/pages/funcionario/AlunoForm.tsx) | [`funcionario.test.ts`](backend/tests/funcionario.test.ts), [`mysql.funcionario.integration.test.ts`](backend/tests/mysql.funcionario.integration.test.ts) |
| **Rafael Fernandes Guedes Mota** ([@guedesmota23-create](https://github.com/guedesmota23-create)) | RF04 / RF05 / RF06: lançamento de notas, cursos/disciplinas e painel do aluno (API + UI) | [`rotas/notas.ts`](backend/src/rotas/notas.ts), [`rotas/cursos.ts`](backend/src/rotas/cursos.ts), [`PainelAluno.tsx`](frontend/src/pages/PainelAluno.tsx), [`Notas.tsx`](frontend/src/pages/funcionario/Notas.tsx) | [`app.test.ts`](backend/tests/app.test.ts), [`funcionario.test.ts`](backend/tests/funcionario.test.ts) |

## Contribuição e commits

Mensagens no padrão **Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, `refactor:`). Regras e exemplos em **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Estrutura

```
.github/workflows/   CI (testes, cobertura, lint, SonarCloud)
database/            scripts SQL e diagrama ER
backend/             API (veja backend/README.md)
  src/               código
  tests/             testes automatizados
frontend/            site em React (veja frontend/README.md)
scripts/             comandos instalar e dev
docs/                plano de testes
```

## Licença

Distribuído sob a licença **GPL-3.0**. Veja [LICENSE](LICENSE).
