# 🏋️ Proposal: Módulo de Treino (Fitness) & UX Improvements

## 1. Visão Geral e Objetivo

O objetivo central desta spec é integrar uma gestão de rotina de exercícios com formato nativo ao TempoApp. O "Treino" será tratado como uma extensão da entidade "Tarefa" (`Task`), compartilhando lógicas de conflitos, tempo e categorias, cruzando desempenho físico com a produtividade no trabalho e estudos.

Além disso, esta spec abrange correções urgentes de UI levantadas durante a validação da V4:

- Inclusão do novo componente `AnimatedTabs`.
- Correção de contraste do `Header`.
- Correção do fluxo onde "Sumiço das categorias" ou falha de RLS no Upload de Avatar ocorria (Embora já endereçados no código, entra como Check de Qualidade aqui).

## 2. Requisitos e User Stories

**Módulo de Treino**

- [ ] Como usuário, quero poder indicar que uma tarefa é do tipo "Treino" (`workout`) ao adicionar na agenda.
- [ ] Como usuário, ao criar um treino, quero definir o tipo de treino (ex: musculação, cardio), grupo muscular alvo e intensidade.
- [ ] Como usuário, quero ter uma aba dentro da tarefa de Treino onde eu listo a minha rotina/exercícios (comportando-se como subtarefas do treino).
- [ ] Como usuário, quero visualizar no Analytics o impacto dos treinos concluídos em minha taxa de sucesso nas demais áreas (Work, Academic).

**UX & Navegação**

- [ ] Como usuário, quero clicar num Card de Categoria na Home e ir para uma View de Categoria (Página separada separada em tabs de concluídas e pendentes).
- [ ] Como usuário, espero que a troca de abas nesta View seja fluida (via `AnimatedTabs`).
- [ ] Como usuário, preciso conseguir ver a separação entre o Header Glass e o fundo facilmente.

## 3. Análise de O Que Já Existe (Reuso)

- **Tabela de Tasks**: O backend (`Supabase`) já suporta o CRUD completo das tarefas e categorias atreladas. Todo o agendamento pode aproveitar a mesma tabela `tasks`.
- **Componentes Base**: Formulários flutuantes (SmartAdd/TaskEditSheet) estão maduros e serão o palco das edições condicionais.

## 4. O Que Precisa Ser Criado/Alterado

- **Banco de Dados:** Precisamos rodar uma Migration (via Supabase MCP) para incluir colunas: `task_type` (text), `workout_type` (text), `target_muscle_group` (text), `intensity` (text) na tabela `tasks`. Uma outra tabela `subtasks` vinculada a `task_id` para abrigar a lista de exercícios curtos.
- **Tipagem (Frontend):** Criar `src/types/data.ts` para solidificar todos os retornos do Supabase referentes à Tasks + Workouts + Subtasks.
- **SmartAdd & TaskEditSheet:** Devem possuir um "Toggle/Select de Tipo da Tarefa", mostrando condicionalmente os campos físicos.
- **View Dedicada:** `src/pages/CategoryView.tsx` já iniciada; precisa de refinamento caso falte algo.
- **Analytics:** Criar o painel/insight correlacionando "Saúde x Produtividade".

## 5. Critérios de Aceite

1. O usuário consegue adicionar um Treino ao invés de Tarefa Normal via SmartAdd.
2. A listagem (Timeline e Calendário) mostra de forma distintiva (visualmente diferenciado ou usando Badge específico).
3. Analytics mostra mensagem correlacionada.
4. Header atualizado globalmente no .css (feito paralela com a proposal, mas homologável).
5. O Spec Kit guiando a equipe segue estrito ordenamento sem duplicação de componentes.
