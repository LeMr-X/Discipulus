# Plano de testes — Discipulus

Este documento mostra **o que já é testado**, **como rodar** e o **cronograma** do que ainda está planejado até a entrega final (02/12/2026).

## 1. Objetivo e escopo

Verificar se o cadastro de alunos, o login e o lançamento de notas seguem os requisitos do [README](../README.md#requisitos-funcionais) e as regras de negócio documentadas. Metas da A3:

- cobertura de código de pelo menos **75%** (exigida automaticamente no CI);
- **quality gate aprovado** no SonarCloud;
- issues de análise estática resolvidas ou justificadas.

**Fora do escopo nesta etapa:** testes automatizados do front-end, testes de carga e de segurança avançados (estão no cronograma, seção 6).

## 2. Ferramentas

| Ferramenta | Uso |
|---|---|
| Vitest | Testes unitários, de API e de integração (back-end) |
| Supertest | Requisições HTTP à API sem subir o servidor |
| @vitest/coverage-v8 | Cobertura (`backend/coverage/lcov.info`) |
| MySQL 8 | Banco real dos testes de integração (serviço no CI) |
| ESLint + TypeScript (`tsc`) | Análise estática local e no CI |
| GitHub Actions | CI: roda tudo a cada push e pull request ([ci.yml](../.github/workflows/ci.yml)) |
| SonarCloud | Análise estática, cobertura e quality gate |

## 3. Níveis de teste

| Nível | O que verifica | Onde está | Banco? | Situação |
|---|---|---|---|---|
| Unitário | Regras de negócio, validação, permissões, token, login (com repositório em memória) | `backend/tests/*.test.ts` | Não | ✅ Funciona |
| API (componente) | Rotas HTTP, códigos de resposta, permissões por cargo | `app.test.ts`, `funcionario.test.ts` | Não (fakes) | ✅ Funciona |
| Integração | SQL real: procedure de login, triggers, view `vw_boletim`, transação do cadastro | `mysql.*.integration.test.ts` | Sim | ✅ Funciona (local com `DB_TESTE=1` e no CI) |
| Sistema (ponta a ponta) | Navegador → front-end → API → MySQL | — | Sim | 🕒 Planejado (Playwright) |
| Validação (aceitação) | Critérios de aceitação do README, feitos pelo grupo no sistema rodando | Roteiro na seção 5 | Sim | 🕒 Planejado: roteiro manual, depois automatizado |

## 4. Regras de negócio e casos de teste

### RN01: escala de notas

Nota de **0,00 a 10,00**, com no máximo **2 casas decimais**, para as avaliações **A1, A2 e A3**. Ela é validada na API (zod) e também no banco (`CHECK nota BETWEEN 0 AND 10`).

| Caso | Entrada | Esperado | Teste |
|---|---|---|---|
| Válido | 0; 0,01; 6,99; 7; 9,99; 10 | Aceita | [escalaNotas.test.ts](../backend/tests/escalaNotas.test.ts) |
| Limite inferior | -0,01 | Recusa: "A nota vai de 0 a 10." | [escalaNotas.test.ts](../backend/tests/escalaNotas.test.ts) |
| Limite superior | 10,01 | Recusa: "A nota vai de 0 a 10." | [escalaNotas.test.ts](../backend/tests/escalaNotas.test.ts) |
| Casas decimais | 7,001 | Recusa: "Use no máximo 2 casas decimais." | [escalaNotas.test.ts](../backend/tests/escalaNotas.test.ts) |
| Avaliação inválida | A0, A4 | Recusa | [escalaNotas.test.ts](../backend/tests/escalaNotas.test.ts) |
| Banco barra fora da escala | 10,5 direto no SQL | Erro 3819 (CHECK) | [mysql.situacao.integration.test.ts](../backend/tests/mysql.situacao.integration.test.ts) |

### RN02: situação do aluno na disciplina

Média aritmética de A1, A2 e A3. **Média ≥ 7 → APROVADO**; média < 7 → REPROVADO; menos de 3 notas → EM ANDAMENTO.

| Caso | Notas | Esperado | Teste |
|---|---|---|---|
| Incompleto | A1=10, A2=10 | EM ANDAMENTO | [mysql.situacao.integration.test.ts](../backend/tests/mysql.situacao.integration.test.ts) |
| Limite (aprova) | 7, 7, 7 → média 7,00 | APROVADO | idem |
| Limite (reprova) | 7, 7, 6,97 → média 6,99 | REPROVADO | idem |
| Correção recalcula | 5, 6, 7 → depois A3=10 | REPROVADO → APROVADO | idem |

### RN03: matrícula e nota só com matrícula/curso ativo

| Caso | Esperado | Teste |
|---|---|---|
| Matrícula em curso ativo | Aceita | [regras.test.ts](../backend/tests/regras.test.ts) |
| Matrícula em curso inativo ou inexistente | Recusa (422) | [regras.test.ts](../backend/tests/regras.test.ts), [funcionario.test.ts](../backend/tests/funcionario.test.ts) |
| Nota com matrícula trancada | Recusa (trigger, 422) | [mysql.funcionario.integration.test.ts](../backend/tests/mysql.funcionario.integration.test.ts) |

### RN04: bloqueio de login

| Caso | Esperado | Teste |
|---|---|---|
| Senha certa | Entra (200 + token) | [authService.test.ts](../backend/tests/authService.test.ts), [app.test.ts](../backend/tests/app.test.ts) |
| 1ª e 2ª senha errada | Recusa e informa tentativas restantes | idem |
| 3ª senha errada | Bloqueia por 15 min (423) | idem + [mysql.integration.test.ts](../backend/tests/mysql.integration.test.ts) |
| Senha certa durante o bloqueio | Continua bloqueado | [authService.test.ts](../backend/tests/authService.test.ts) |
| Usuário inativo | Recusa (403) | idem |

## 5. Roteiro de validação (aceitação manual)

Executar com `npm run banco` e depois `npm run dev`, em http://localhost:5173. Senha de todos: `Senha@123`.

| # | Passos | Resultado esperado | Critério |
|---|---|---|---|
| V1 | Entrar como `roberto.lima@faculdade.edu.br`, cadastrar aluno em Ciência da Computação | Aluno aparece na lista com RA novo `2026000007` | CA01 |
| V2 | Entrar com o RA criado e a senha inicial | Painel do aluno abre, boletim vazio | CA01, CA02 |
| V3 | Entrar como `juliana.prado@faculdade.edu.br`, lançar 11 numa nota | Mensagem "A nota vai de 0 a 10." e nada é gravado | CA03 |
| V4 | Lançar 7, 7 e 7 para o aluno | Situação APROVADO, média 7,00 | CA04 |
| V5 | Errar a senha 3 vezes com `2026000001` | Mensagem de bloqueio por 15 minutos | CA05 |
| V6 | Entrar como professora e tentar cadastrar aluno | Opção não aparece; a API responde 403 | CA06 |

## 6. Cronograma

| Período | Atividade | Responsável | Situação |
|---|---|---|---|
| até 18/11 | Código, testes unitários, de API e de integração publicados na `main` | Wesley, Eduardo e Rafael | 🔄 Em andamento |
| até 18/11 | CI no GitHub Actions (testes + MySQL + cobertura + lint) | Rafael (`@guedesmota23-create`) | 🔄 Em andamento |
| até 20/11 | SonarCloud ligado ao repositório, quality gate verde | Wesley (`@LeMr-X`) e Rafael (`@guedesmota23-create`) | 🕒 Planejado |
| até 23/11 | Corrigir issues do SonarCloud (análise estática) e registrar as correções | Wesley, Eduardo e Rafael | 🕒 Planejado |
| até 25/11 | Testes de validação: roteiro manual da seção 5 executado e registrado | Eduardo (`@Eduardo-Arjp`) | 🕒 Planejado |
| até 27/11 | Testes de sistema automatizados (Playwright: login, cadastro, nota) | Rafael (`@guedesmota23-create`) | 🕒 Planejado |
| até 29/11 | Testes do front-end (Vitest + Testing Library) para formulários | Wesley (`@LeMr-X`) e Eduardo (`@Eduardo-Arjp`) | 🕒 Planejado |
| até 30/11 | Revisão final: cobertura ≥ 75%, quality gate verde, README atualizado | Todos | 🕒 Planejado |
| 02/12 | Entrega final | Todos | — |

## 7. Como rodar os testes

```bash
# Na raiz do projeto
npm test              # unitários e de API (não precisa de MySQL)
npm run coverage      # o mesmo, com cobertura em backend/coverage/
```

Com o MySQL (inclui integração; é assim que o CI roda e onde a meta de 75% é exigida):

```powershell
# Windows (PowerShell), dentro de backend/
npm run banco
$env:DB_TESTE="1"; npm run coverage
```

```bash
# Linux/macOS/Git Bash, dentro de backend/
npm run banco
DB_TESTE=1 npm run coverage
```

## 8. Critérios de saída

- Todos os testes passando no CI (✅ na aba Actions).
- Cobertura ≥ 75% (linhas, comandos, funções e ramos). O Vitest falha se ficar abaixo.
- Quality gate do SonarCloud aprovado.
- Roteiro de validação (seção 5) executado sem falhas.
