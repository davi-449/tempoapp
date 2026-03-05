# 🛠️ Design & Arquitetura: Módulo de Treino e UX

## 1. Visão de UI (Integração Front-end)

### Módulo de Treinos

- A complexidade visual aumenta no formulário. A lógica será gerida localmente pelo **Antigravity**.
- Para lista de **Subtarefas (Exercícios)**: Criaremos um componente de lista de checklist simples (`SubtaskList.tsx`) acoplável dentro do `TaskEditSheet`.
- **Análise no Board:** O componente `AnalyticsPage` será expandido pelo **Antigravity** puro sem refazer toda a UI pelo Stitch. O Stitch deve intervir apenas se o painel final ficar enorme.

### UX "Glass Header" e Tabs

- Melhorias de Shadow e saturação nos arquivos base (CSS Variables e Utility classes já manipuladas no Antigravity).
- `AnimatedTabs.tsx`: Componente de framer-motion limpo, encapsulado na pasta `src/components/ui/`.

## 2. Visão de Dados (Supabase Backend)

A modelagem estenderá a tabela principal `tasks`.

**Tabela `tasks` (ALTER TABLE):**

- Modificações:
  - `task_type`: `text` padrão `'task'`. Pode ser `'workout'`, `'routine_class'`.
  - `workout_type`: `text` (strength, cardio, flexibility, sports)
  - `target_muscle_group`: `text`
  - `intensity`: `text` (low, medium, high)

**Nova Tabela `subtasks`:**

- Responsável pelos exercícios do treino (Ex: "Supino 4x10").
- Colunas:
  - `id`: uuid PK
  - `task_id`: uuid FK references `tasks.id` ON DELETE CASCADE
  - `title`: text (descrição do exercicio/checklist)
  - `is_completed`: boolean default false
  - `order`: smallint.

**Fluxo Banco de Dados:**
A Migration será aplicada via Supabase MCP (`apply_migration`) na Fase de Implementação.

## 3. Mapa de Dependências

- `CategoryView.tsx` depende de `AnimatedTabs.tsx` e rotas do `App.tsx`.
- `SmartAdd.tsx` e `TaskEditSheet.tsx` dependem da tabela `tasks` estar migrada com os novos campos e a criação do Hook `useTaskForm` ou adaptações locais.
- A exclusão e recuperação se apoiarão na Row Level Security configurada (já validado pro user atual no banco).
