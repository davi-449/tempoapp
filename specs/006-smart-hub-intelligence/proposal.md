# 📋 Spec 006 — Smart Hub Views + Completion Intelligence

## Problema

O Hub de Categorias hoje joga **todas as tarefas em uma lista corrida** sem separação temporal (Hoje, Amanhã, Próx. Semana) e sem agrupamento contextual (matéria/professor no Estudo, grupo muscular no Treino). Ao completar uma tarefa, não há oportunidade de adicionar notas de aula, registrar intensidade do treino, ou estimar calorias queimadas. A aba "Todos" é genérica e sem insights. A tela de Analytics existente é global e não oferece análise por categoria.

---

## Requisitos e User Stories

### US-00: Fix Onboarding Estudo — Horários Reais + Home Study Opcional

> Como estudante, quero informar o **horário real de início de cada aula** (ex: Programação às 13:30, Modelagem 3D às 08:00) em vez de ter tudo hardcoded pra 08:00. O "Foco Pós-Aula" deve ser **opcional** (checkbox), não obrigatório.

### US-01: Agrupamento Temporal de Tasks

> Como usuário, quero ver minhas tarefas separadas por **Hoje**, **Amanhã** e **Esta Semana** dentro de cada aba de categoria, para entender rapidamente o que preciso fazer agora vs. depois.

### US-02: Agrupamento Contextual por Categoria

> Como estudante, quero ver minhas aulas agrupadas por **Matéria/Professor**, e como treinador quero agrupar meus treinos por **divisão** (Perna, Peito, Costas...), para não ver uma lista flat e confusa.

### US-03: Completion Sheet Inteligente (Notas / Workout Log)

> Ao marcar uma tarefa como concluída, quero ter uma **Sheet opcional** para:
>
> - **Estudo**: Adicionar notas da aula e salvar para referência futura.
> - **Treino**: Registrar duração real, intensidade percebida (1-5), e receber estimativa de calorias queimadas.
> - **Geral/Trabalho**: Adicionar comentário rápido (opcional).

### US-04: Estimativa de Calorias (Treino)

> Ao concluir um treino, o sistema deve estimar calorias baseado na fórmula MET × peso(kg) × duração(h). O peso vem do onboarding ou pode ser configurado no perfil.

### US-05: Insights por Categoria (Tela Dedicada)

> Cada Hub de categoria deve ter um **botão "Ver Insights"** que abre uma tela dedicada com gráficos e métricas específicas daquela categoria, sem poluir a view principal.

### US-06: Aba "Todos" Melhorada

> A aba "Todos" deve ter agrupamento temporal (Hoje/Amanhã/Semana) e mostrar mini-cards de resumo por categoria no topo.

---

## O que JÁ EXISTE e será REUTILIZADO

| Artefato            | Caminho                                         | Status                                                                                |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `CategoriesHub.tsx` | `src/pages/CategoriesHub.tsx`                   | ✅ Base principal — será **refatorado**                                               |
| `Analytics.tsx`     | `src/pages/Analytics.tsx`                       | ✅ 246 linhas, usa **Recharts**. Será referência para os novos gráficos por categoria |
| `TaskEditSheet.tsx` | `src/components/TaskEditSheet.tsx`              | ✅ 306 linhas. Será **estendido** com uma sub-view de completion                      |
| `useCategories.ts`  | `src/hooks/useCategories.ts`                    | ✅ Já tem deduplicate. Pode receber settings                                          |
| `AnimatedTabs`      | `src/components/ui/animated-tabs.tsx`           | ✅ Tabs do Hub — sem mudanças                                                         |
| `SmartAdd.tsx`      | `src/components/SmartAdd.tsx`                   | ✅ Sem mudanças diretas                                                               |
| `types/data.ts`     | `src/types/data.ts`                             | ✅ Interfaces Task, Category, WorkoutType, WorkoutIntensity                           |
| `DynamicOnboarding` | `src/features/categories/DynamicOnboarding.tsx` | ✅ Sem mudanças                                                                       |

## O que precisa ser CRIADO

| Artefato                  | Tipo              | Justificativa                                                                |
| ------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `useTaskGroups.ts`        | Hook              | Agrupa tasks por Hoje/Amanhã/Semana/Futuro e por contexto (matéria, divisão) |
| `TaskCompletionSheet.tsx` | Componente        | Sheet que aparece ao completar task — condicional por tipo                   |
| `CategoryInsights.tsx`    | Página/Componente | Tela dedicada de insights por categoria com Recharts                         |
| `useCalorieEstimator.ts`  | Hook/util         | Calcula calorias: MET × peso × duração                                       |
| `task_completion_logs`    | Tabela Supabase   | Armazena notas de aula, workout logs, calorias estimadas                     |

---

## Critérios de Aceite

0. [ ] Onboarding Estudo corrigido: pergunta horário real por matéria + Foco Pós-Aula opcional.
1. [ ] Tasks agrupadas por data (Hoje/Amanhã/Semana) em todas as abas.
2. [ ] Agrupamento por Matéria (Estudo) e Divisão (Treino) nas abas respectivas.
3. [ ] Sheet de completion aparece ao clicar "concluir" com campos condicionais.
4. [ ] Notas de aula salvas e consultáveis depois.
5. [ ] Calorias estimadas com base em MET × peso × duração.
6. [ ] Botão "Insights" por categoria abrindo tela dedicada com gráficos.
7. [ ] Aba "Todos" com agrupamento temporal + resumo por categoria no topo.
8. [ ] Sem duplicação de componentes ou hooks existentes.
