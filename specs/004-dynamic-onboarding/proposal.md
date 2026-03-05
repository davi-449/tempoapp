# Spec 004: Onboarding Dinâmico por Categoria

## 1. Contexto e Requisitos

O usuário apontou que o onboarding mestre unificado (`CategoryOnboarding.tsx`) falha ao não refletir as nuances de cada categoria da vida real. Um "Trabalho" tem regras, horários e dias totalmente diferentes de um "Treino".

**Objetivo:** Abandonar o modelo "one-size-fits-all" baseando a UX do Wizard no nome/identificador da própria Categoria selecionada no Hub.

## 2. User Stories

- Como usuário, ao abrir a aba "Trabalho", quero informar meus dias úteis, horário de expediente, horário de almoço e foco principal, para que o sistema popule minha agenda com blocos exatos de ocupação.
- Como usuário, ao abrir a aba "Treino", quero informar meus dias de academia, minha divisão (ex: A, B, C) e duração para que eu saiba exatamente o que treinar a cada dia da semana.
- Como estudante ("Estudos" ou "Faculdade"), quero informar dias letivos, matérias do semestre e janelas de break.

## 3. O que JÁ EXISTE e será REUTILIZADO

- `CategoriesHub.tsx`: Toda a lógica de verificação de `settings.isConfigured` permanece igual.
- Tabela `categories` (com JSONB `settings`): Perfeita para guardar configurações flexíveis.
- Tabela `tasks`: Já compatível com as inserções (`task_type: 'workout' | 'task'`).
- `framer-motion`: Para as transições de Slide que já provaram valor na V1.

## 4. O que precisa ser CRIADO/MODIFICADO

1. **Router de Onboarding (`DynamicOnboarding.tsx`)**: Absorverá a role atual do `CategoryOnboarding.tsx`, mas atuará apenas como um Switch que devolve o Wizard certo dependendo do `category.name` (Trabalho, Treino, Estudos, DEFAULT).
2. **Wizards Especializados** (novos componentes em `src/features/categories/onboarding/`):
   - `WorkOnboarding.tsx`
   - `WorkoutOnboarding.tsx`
   - `StudyOnboarding.tsx`
3. **Generators Inteligentes**: Funções atreladas a cada fluxo que calculam e forjam `[tasks]` reais no banco de dados, alinhadas às datas reais (D+0 a D+14).
