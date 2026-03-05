# Implementation Tasks: V4 Premium Redesign

## 1. Database & Backend (Supabase MCP)

- [ ] Criar migrations para tabela `categories` (`id`, `user_id`, `name`, `color`, `emoji`).
- [ ] Criar bucket de storage `avatars` no Supabase e policy pública de leitura.
- [ ] Configurar tabela `profiles` se não existir, e adicionar `avatar_url`.
- [ ] Gerar novos tipos Typescript (`database.types.ts`).

## 2. Foundation & Design System

- [ ] Atualizar `tailwind.config.ts` e `index.css` com novas variáveis de `borderRadius` (ex: `--radius: 1.5rem`), remover bordas dos cartões por padrão, ajustar cores de fundo.

## 3. Features: Perfil & Categorias

- [ ] Criar componente de Upload de Avatar/Foto de Perfil.
- [ ] Atualizar o `Header` para ter um `DropdownMenu` com as opções do perfil clicando no Avatar.
- [ ] Criar modal/página para Gerenciamento de Categorias (Adicionar, Editar, Excluir).
- [ ] Atualizar queries de tarefas e formulários (`SmartAdd`, `TaskEditSheet`) para usar as categorias do banco de dados em vez da constante `CATEGORIES` hardcoded.

## 4. UI Redesign: Home e Timeline

- [ ] Refatorar os Cards de KPI da Home (mais bold, padding maior, super rounded).
- [ ] Refatorar Resumo por Categorias na Home.
- [ ] **Redesign Completo dos Task Cards (`Timeline.tsx`):**
  - Remover borda lateral pesada.
  - Arredondamento extremo (`rounded-[24px]`).
  - Distribuir informações para parecer um app de passagens/finanças (minimalista).
  - Checkbox redondo e maior.

## 5. Polish

- [ ] Blur overlays mais pesados.
- [ ] Verificar layout nos modais.
