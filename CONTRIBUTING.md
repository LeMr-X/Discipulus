
## Convenção das mensagens de commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

```
<tipo>(<escopo opcional>): <descrição no imperativo, em minúsculas, sem ponto final>
```

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Nova funcionalidade | `feat(alunos): cadastra aluno com matrícula e login` |
| `fix` | Correção de bug | `fix(notas): recusa nota acima de 10` |
| `test` | Criação ou ajuste de testes | `test(regras): cobre semestre no limite do curso` |
| `docs` | Somente documentação | `docs: adiciona requisitos funcionais ao README` |
| `refactor` | Mudança de código sem mudar comportamento | `refactor(auth): extrai geração de token` |
| `style` | Formatação, sem mudar lógica | `style(frontend): aplica lint` |
| `ci` | Integração contínua (GitHub Actions, SonarCloud) | `ci: roda testes de integração com MySQL` |
| `chore` | Configuração, dependências, scripts | `chore: adiciona script de instalação` |

**Escopos usados:** `database`, `backend`, `frontend`, `auth`, `alunos`, `cursos`, `notas`, `regras`, `ci`.

Regras:

- Um commit = uma mudança lógica (não misture feature e documentação no mesmo commit).
- Descrição curta (até ~72 caracteres). Detalhes vão no corpo, depois de uma linha em branco.
- Para relacionar à issue, use `Refs #1` (ou `Closes #1` para fechar) no corpo da mensagem.

Exemplo completo:

```
test(notas): valida escala de 0 a 10 com duas casas

Cobre nota válida (7.5), limite inferior (0), limite superior (10)
e rejeição de -0.01 e 10.01.

Refs #1
```
