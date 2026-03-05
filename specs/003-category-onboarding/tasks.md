# 📋 Tasks (Plano de Ação) — Módulo 003 (Category Onboarding)

Utilize a flag `[/]` para "Em progresso" e `[x]` para concluída.
Estes passos orientam a chamada do `/vibe-apply`.

## Parte 1: Modelagem e Banco (Supabase)

- [x] Aplicar no Banco de Dados: `ALTER TABLE categories ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;`
- [x] Re-injetar Types/Interfaces atualizados da tabela `categories` para conter o `settings: any`.

## Parte 2: O Componente Inteligente (Onboarding)

- [x] Construir o componente em `src/features/categories/CategoryOnboarding.tsx` (ou pasta `components`).
- [x] Implementar a Lógica do "Wizard" usando Framer Motion (Transição de Slide horizontal).
  - Step 1: "Qual o seu objetivo principal aqui?"
  - Step 2: "Quantos dias na semana?" (Dias da semana buttons)
  - Step 3: Setup de Horário Base
- [x] Integrar no botão Finalizar a função geradora: criar loop que faz um Array de novas `tasks` (com status _pending_) distribuídas nos próximos 30 dias para os dias informados, enviando pro Supabase.
- [x] Ao final do insert das tasks, engatar o update na categoria marcando `settings = { isConfigured: true, ... }`.

## Parte 3: Integração na Tela Hub (CategoriesHub)

- [x] Criar a página de Roteamento Global `src/pages/CategoriesHub.tsx`.
- [x] Adicionar o atalho dela ao menu inferior do App (`BottomNav` ou equivalente).
- [x] Incorporar as `<AnimatedTabs />` na página:
  - Aba 0: "Geral" (Todos).
  - Aba 1, 2, 3..: Para cada categoria cadastrada no banco.
- [x] Lógica de Renderização Condicional: Em cada Tab, se `isConfigured` for false, renderiza `<CategoryOnboarding />`. Se true, renderiza a lista de Tarefas.
- [x] (Opcional) Deletar/Obsoletar a antiga `CategoryView.tsx` caso ela perca a utilidade após o Hub.
