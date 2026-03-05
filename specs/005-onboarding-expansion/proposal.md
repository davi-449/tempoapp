# Spec 005: Onboarding Expansion & Master Bugfix

## 1. Contexto e Diagnóstico

### 1.1 Bugs Reportados

- **Erro 400 Bad Request `tasks`**: O formulário do Onboarding Dinâmico (Módulo 004) tentava salvar as tarefas na DB utilizando a chave `category: "Nome"`. Contudo, o Banco de Dados relacional requer `category_id` como UUID.
- **Erro 400 Bad Request `categories`**: O hook `useCategories` espalha na UI categorias dummy (ex: `default-2` para "Trabalho"). Quando o Onboarding termina, ele tenta disparar um `PATCH /categories?id=eq.default-2`. O Postgres entra em colapso porque `default-2` não é um UUID numérico e não existe no BD.
- **React Warning (AnimatedTabs)**: Warns the usage of Refs on functionally structured components without `forwardRef`.

### 1.2 Novos Requisitos do Usuário (Expansão)

O usuário requisitou mais inputs em cada wizard:

- **Treino**: Cadastrar altura, peso e gerar cálculos/baseline.
- **Estudos**: Informar a instituição ("Onde estudo"), listar matérias, atrelar professores, determinar quantas e quais aulas acontecem em quais dias no detalhe.
- **Trabalho**: Cadastrar nome da empresa, além das informações atuais.

## 2. A Solução (Design)

1. **Sanitização de DB Categories**: No momento do Finish do Onboarding, se a categoria atual tiver um id `default-XX`, o sistema **Criará** a Categoria fisicamente no banco antes de mais nada e usará o novo UUID real retornado para atrelar às `tasks`.
2. **Refatoração Complexa dos Onboardings**:
   - `WorkoutOnboarding.tsx`: Terá passo extra para coletar `weight`, `height`.
   - `StudyOnboarding.tsx`: Mudará de simples "Deep Work" para captura matricial: `instituição`, lista de `subjects` com nome, professor associado e alocação por dia da semana.
   - `WorkOnboarding.tsx`: Passo para inserir `companyName`.

## 3. Lógica Técnica e Reutilização

- Todo o código recém-escrito será apenas estendido. Nenhum arquivo será deletado.
- Os _wizards_ continuarão em `.tsx` gerido por Framer Motion.
- A persistência no JSONB `settings` do banco garantirá que possamos guardar literalmente TODOS esses novos dados customizados por categoria de forma invisível no schema relacional da tabela `categories`.
