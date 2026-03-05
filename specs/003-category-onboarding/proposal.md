# 🚀 Proposal: Category Views & Onboarding Interativo (003-category-onboarding)

## 1. Visão Geral e Objetivo

O usuário precisa de uma imersão maior no contexto de cada categoria (Treino, Pessoal, Faculdade, Trabalho) sem que isso custe espaço na barra de navegação inferior (Bottom Navbar).
A solução proposta é a criação de um **Hub Central (Tela Única)** acessível pela Navbar. Nesta view, o componente preexistente `<AnimatedTabs />` será usado de forma inteligente para varrer as categorias.
A primeira aba será uma "Visão Geral", e as demais abas serão as categorias dedicadas. Ao entrar em uma aba dedicada vazia (sem configurações iniciais), o usuário passará por um **Mini-Onboarding Inteligente** que povoará sua agenda.

## 2. Requisitos & User Stories

### User Stories

- **Como usuário**, eu quero acessar uma única tela "Hub de Vida" na navbar, e através de Tabs animadas, deslizar até "Treino", responder duas perguntas e ver minha agenda de exercícios ser automatizada.

### Requisitos Técnicos

- O onboarding só deve rodar se a categoria não tiver o setup ainda (verific- Integrar a Navbar inferior contendo o link para esse **Dashboard Setorial (Categories Hub/Life Hub)**.
- O componente de Tabs deve injetar as views de forma lazy para não sobrecarregar a memória, já que todas as categorias coexistirão na mesma rota principal.
- Gerador de agenda: O onboarding faz batch insert na tabela `tasks` (Ex: criar tarefas para os próximos 30 dias automaticamente nos dias informados de treino/estudo) na categoria em questão.

## 3. Reaproveitamento (Regra Anti-Alucinação)

- **O que será usado**: Tabela `categories` existente, tela base. Arquitetura de UI `AnimatedTabs.tsx`.
- **O que precisa ser CRIADO**: Página principal `CategoriesHub.tsx`, componente inteligente transversal `CategoryOnboarding.tsx`.

## 4. Critérios de Aceite

- Ao entrar em uma Categoria sem `settings` configurados, a tela de onboarding engata sozinha.
- O onboarding coleta 3 a 4 informações hiper focadas.
- O clique de submissão do Onboarding reflete dezenas de Tarefas na timeline em questão de segundos.
