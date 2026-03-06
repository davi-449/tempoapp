# 📋 Tasks — Spec 006: Smart Hub Views + Completion Intelligence

## Fase 0: Fix Onboarding Estudo

- [ ] Refatorar `StudyOnboarding.tsx` → adicionar campo de **horário de início** por matéria (input time)
- [ ] Tornar o "Foco Pós-Aula" um **checkbox opcional** (desligado por padrão)
- [ ] Usar o horário real informado ao gerar tasks (em vez de hardcode 08:00)
- [ ] Se Foco Pós-Aula desligado, não gerar essas tasks extras

## Fase 1: Infraestrutura de Dados

- [ ] Criar tabela `task_completion_logs` no Supabase (migration SQL via SQL Editor Lovable)
- [ ] Criar hook `useTaskGroups.ts` — agrupa tasks por Hoje/Amanhã/Semana/Futuro
- [ ] Criar util `useCalorieEstimator.ts` — MET × peso × duração

## Fase 2: Agrupamento Temporal no Hub

- [ ] Refatorar `CategoriesHub.tsx` → aba "Todos" com agrupamento Hoje/Amanhã/Semana
- [ ] Refatorar cada category tab para usar `useTaskGroups` com headers temporais
- [ ] Adicionar agrupamento contextual no Treino (por divisão/tipo)
- [ ] Adicionar agrupamento contextual no Estudo (por matéria/professor)

## Fase 3: Completion Intelligence

- [ ] Criar `TaskCompletionSheet.tsx` — Sheet condicional por tipo (treino/estudo/geral)
- [ ] Integrar no `CategoriesHub` → ao clicar ✓, abre a sheet antes de marcar como concluída
- [ ] Salvar logs em `task_completion_logs` via Supabase
- [ ] Para treinos: calcular e exibir calorias estimadas em tempo real

## Fase 4: Insights por Categoria

- [ ] Criar `CategoryInsights.tsx` — tela de gráficos dedicada por categoria
- [ ] Treino: calorias acumuladas, intensidade média, evolução semanal
- [ ] Estudo: horas estudadas, notas por matéria, frequência de aulas
- [ ] Trabalho: horas trabalhadas, produtividade semanal
- [ ] Pessoal: insights genéricos baseados em conclusão
- [ ] Adicionar botão "Ver Insights" no header card de cada categoria

## Fase 5: Testes e Polish

- [ ] Testar completion flow completo (treino + estudo + geral)
- [ ] Verificar que notas são salvas e consultáveis
- [ ] Verificar cálculo de calorias com diferentes pesos/durações
- [ ] Commit e push no origin para deploy Lovable
