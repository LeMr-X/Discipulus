# Discipulus — Front-end

React 19 + TypeScript + Vite + Tailwind CSS 4.

## Rodar

Primeiro suba o back-end (veja `backend/README.md`). Depois:

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Senha de todas as contas de teste: `Senha@123` (os botões "Contas de teste" na tela de login preenchem os campos: aluna, secretaria, professora e aluno inativo; eles só aparecem em modo de desenvolvimento).

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/api/` | Tipos (cópia de `backend/src/tipos.ts`) e todas as chamadas ao back-end (`index.ts`). |
| `src/auth/` | Sessão do usuário logado (zustand, guardada só na aba). |
| `src/components/ui/` | Componentes base: Button, Field, Select, Badge, Card, Dialog, Spinner. |
| `src/pages/` | Login e painel do aluno. |
| `src/pages/funcionario/` | Alunos (lista, cadastro, detalhe), Cursos e disciplinas, Lançamento de notas. |
| `src/lib/` | Formatação (notas, datas, plural) em pt-BR. |

## Bibliotecas

- **Sonner**: avisos (toasts).
- **Base UI**: janelas de diálogo acessíveis (foco, Esc, leitor de tela).
- **clsx** e **class-variance-authority**: variações dos componentes.
- **zustand**: estado da sessão.
- **lucide-react**: ícones.
- **react-router-dom**: rotas protegidas por perfil (aluno x funcionário).
