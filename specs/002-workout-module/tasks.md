# 📋 Tasks (Plano de Ação) — Módulo 002

Utilize a flag `[/]` para "Em progresso" e `[x]` para concluída.
Estes passos orientam a chamada do `/vibe-apply`.

## Parte 1: Ajustes Base de UX/UI

- [x] Aplicar no `index.css` correções de `glass-panel` sem bordas escuras nos cartões.
- [x] Ajustar botões do dashboard (`CardHover`) para remover o outline "chumbado" que deixava a UI bruta.
- [x] Acoplar no header o Dropdown Menu com suporte a Foto de Perfil via Supabase Storage. (Criar `AvatarUpload.tsx` ou similar).
- [x] Resolver bug do Dashboard onde categorias "somem" ao adicionar uma nova (Refatorar `useCategories` para usar `mutate` do SWR ou React Query e remover hardcodes).

## Parte 2: Modelagem e Banco (Supabase)

- [x] Expandir/Criar tipos exportados (`data.ts` ou Database.ts) para conter:
  - `task_type: 'task' | 'routine_class' | 'workout'`
  - `workout_type` (força, cardio, flexibilidade...)
  - `target_muscle_group`
  - `intensity`
- [x] Aplicar no Banco de Dados: `ALTER TABLE tasks ADD COLUMN task_type TEXT...`
- [x] Criar Tabela `subtasks` com `task_id` Foreign Key.

## Parte 3: Integração no Front

- [x] Atualizar `SmartAdd.tsx`:
  - Componente de switch "É Treino ou Tarefa?".
  - Inputs condicionais baseados no choice da categoria.
- [x] Componente `<SubtaskList />`:
  - Interface onde na view da task podemos detalhar o que foi feito na academia (supino x10, etc) e dar "Check" a nível de sub item.
- [x] Tela de Analytics:
  - Adicionar o KPI ou subseção de "Corpo & Saúde".
  - Grafico do Recharts para demonstrar as `tarefas vs treinos`.tina de Treino".
- [ ] Conectar os inputs das Subtasks na tela de visualização do dia (`TaskEditSheet`).

## Parte 4: Analytics

- [ ] Atualizar o `Analytics.tsx` injetando logica que observe proporções de `work/academic` completion rate VS dia onde há treino agendado/concluído para produzir um texto inteligente.
