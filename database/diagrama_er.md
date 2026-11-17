# Diagrama ER — sistema_alunos

```mermaid
---
config:
  layout: elk
---
erDiagram
    CURSO ||--o{ DISCIPLINA : "possui"
    ALUNO ||--o{ MATRICULA : "realiza"
    CURSO ||--o{ MATRICULA : "recebe"
    MATRICULA ||--o{ NOTA : "tem"
    DISCIPLINA ||--o{ NOTA : "avaliada em"
    FUNCIONARIO |o--o{ NOTA : "lança"
    MATRICULA ||--o{ HISTORICO_ACADEMICO : "registra"
    ALUNO ||--o| USUARIO : "acessa como"
    FUNCIONARIO ||--o| USUARIO : "acessa como"
    USUARIO |o--o{ LOG_ACESSO : "gera"

    FUNCIONARIO {
        INT id_funcionario PK
        VARCHAR nome
        CHAR cpf UK
        VARCHAR email UK
        ENUM cargo
        DATE data_admissao
        BOOLEAN ativo
    }

    ALUNO {
        INT id_aluno PK
        CHAR ra UK
        VARCHAR nome
        CHAR cpf UK
        VARCHAR email UK
        VARCHAR telefone
        DATE data_nascimento
        VARCHAR logradouro
        VARCHAR numero
        VARCHAR bairro
        VARCHAR cidade
        CHAR uf
        CHAR cep
        DATETIME data_cadastro
    }

    CURSO {
        INT id_curso PK
        VARCHAR nome UK
        ENUM categoria
        TINYINT duracao_semestres
        ENUM status
    }

    DISCIPLINA {
        INT id_disciplina PK
        INT id_curso FK
        VARCHAR nome
        SMALLINT carga_horaria
        TINYINT semestre
    }

    MATRICULA {
        INT id_matricula PK
        INT id_aluno FK
        INT id_curso FK
        DATE data_matricula
        ENUM status
    }

    NOTA {
        INT id_nota PK
        INT id_aluno FK
        INT id_curso FK
        INT id_disciplina FK
        ENUM avaliacao "A1, A2 ou A3"
        DECIMAL nota "0 a 10"
        DATE data_lancamento
        INT id_funcionario FK
    }

    HISTORICO_ACADEMICO {
        INT id_historico PK
        INT id_aluno FK
        INT id_curso FK
        DATETIME data
        ENUM status
        VARCHAR observacao
    }

    USUARIO {
        INT id_usuario PK
        VARCHAR login UK
        CHAR senha_hash "BCrypt"
        ENUM perfil
        INT id_aluno FK
        INT id_funcionario FK
        BOOLEAN ativo
        TINYINT tentativas_falhas
        DATETIME bloqueado_ate
        DATETIME ultimo_acesso
        DATETIME criado_em
        DATETIME atualizado_em
    }

    LOG_ACESSO {
        BIGINT id_log PK
        INT id_usuario FK
        VARCHAR login_informado
        BOOLEAN sucesso
        ENUM motivo
        VARCHAR ip
        DATETIME data_hora
    }
```

## Como ler

- `||--o{` = um para muitos (ex.: um curso possui várias disciplinas).
- `||--o|` = um para zero ou um (ex.: um aluno tem no máximo um usuário de login).
- `|o--o{` = o lado esquerdo é opcional (ex.: uma nota pode ficar sem o funcionário que lançou, se ele for excluído).
- **NOTA** usa chaves estrangeiras compostas: `(id_aluno, id_curso)` aponta para MATRICULA e `(id_disciplina, id_curso)` aponta para DISCIPLINA. Assim a nota só existe se o aluno estiver matriculado e a disciplina for do curso dele.
- **HISTORICO_ACADEMICO** aponta para MATRICULA por `(id_aluno, id_curso)`.
