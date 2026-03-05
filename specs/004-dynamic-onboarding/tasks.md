# 📋 Tasks (Plano de Ação) — Módulo 004 (Dynamic Onboarding)

Utilize a flag `[/]` para "Em progresso" e `[x]` para concluída.

## Parte 1: Infraestrutura de Roteamento de Onboarding

- [x] Renomear o atual `CategoryOnboarding.tsx` para um nome legível ou transformá-lo no `GeneralOnboarding.tsx` (Fallback).
- [x] Criar o componente orquestrador `DynamicOnboarding.tsx` em `src/features/categories/`.
- [x] Implementar a lógica de match no Orquestrador: `if (name.includes('treino')) return <WorkoutOnboarding />`, etc.
- [x] Atualizar `CategoriesHub.tsx` para chamar o `DynamicOnboarding` no lugar do componente antigo.

## Parte 2: Construção dos Wizards Específicos

- [x] Criar arquivo e componente `WorkoutOnboarding.tsx`.
- [x] Criar arquivo e componente `WorkOnboarding.tsx`.
- [x] Implementar o Wizard Horizontal de **Trabalho**, englobando botões de dias úteis e fields de horário de Entrada/Almoço/Saída.
- [x] Implementar o Wizard Horizontal de **Treinos**, englobando perguntas de métodos de divisão.

## Parte 3: Lógica Geradora e Persistência Preditiva no Banco

- [x] Dentro do `.handleFinish` do Trabalho, escrever função de cálculo de D+14 que bata os dias selecionados e popule o Banco via Supabase com os slots corretos.
- [x] Dentro do `.handleFinish` de Treino, efetuar o loop inteligente de popular os eventos do calendário marcando os types com o enum `workout`.
- [x] Atualizar os metadados JSON no `settings` da `categories` permitindo edições futuras.
