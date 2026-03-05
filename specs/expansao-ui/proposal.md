# Vibe Proposal: Expansão UI TempoApp

## 1. Contexto

O MVP atual tem apenas 1 página (Home com Timeline e SmartAdd). O usuário identificou funcionalidades faltantes comparando com uma versão anterior (KAIROS). O design dessa versão anterior é **ruim e não deve ser seguido**, mas as funcionalidades servem de checklist do que falta.

## 2. O que já existe (NÃO duplicar)

- `src/pages/Index.tsx` — Dashboard Home (rota `/`)
- `src/components/Timeline.tsx` — Lista de tarefas do dia (conectado ao Supabase)
- `src/components/SmartAdd.tsx` — Bottom Sheet para criar tarefas (conectado à Edge Function conflict-engine)
- `src/components/NavLink.tsx` — Componente de navegação genérico
- 49 primitivos `shadcn/ui` já instalados (incluindo `calendar`, `tabs`, `progress`, `chart`)
- `framer-motion` **NÃO** está instalado

## 3. O que falta (Novas Telas e Componentes)

### 3.1 [NEW] `src/components/BottomNavBar.tsx`

Menu inferior animado com 4 abas: **Início**, **Calendário**, **Análise**, **Perfil**. Seguir o estilo do código fornecido pelo usuário (com animação de expand no label ativo). Usar `framer-motion` (instalar via `npm install framer-motion`).

### 3.2 [NEW] `src/pages/Calendar.tsx` (rota `/calendario`)

- Visualização mensal de calendário usando o primitivo `calendar.tsx` já existente
- Filtros por categoria (Todos, Pessoal, Trabalho, Faculdade, Treino)
- Toggle entre modo Calendário e modo Lista
- Puxa tarefas do Supabase e marca nos dias que têm tarefas

### 3.3 [NEW] `src/pages/Analytics.tsx` (rota `/analise`)

- Taxa de Conclusão (tarefas concluídas / total)
- Tarefas Atrasadas (não concluídas no prazo)
- Média Diária
- Distribuição por Categoria (gráfico simples usando `recharts` que já está no package.json)
- Tendência de Produtividade (últimas 4 semanas)
- Sugestões Personalizadas (texto estático inteligente baseado nos dados)
- Filtros: Semana / Mês / Trimestre

### 3.4 [NEW] `src/pages/Profile.tsx` (rota `/perfil`)

- Avatar, nome do usuário
- Config de categorias
- Toggle de notificações
- Logout

### 3.5 [MODIFY] `src/pages/Index.tsx`

- Adicionar seção "Resumo por Categoria" (4 cards coloridos com contagem de tarefas por categoria)
- Adicionar KPIs rápidos no topo (Tarefas Hoje, Atrasadas, Notificações)
- Manter Timeline e SmartAdd existentes

### 3.6 [MODIFY] `src/App.tsx`

- Adicionar rotas: `/calendario`, `/analise`, `/perfil`
- Envolver layout com BottomNavBar

## 4. Design Visual (Reforço)

- **NÃO** seguir o design do KAIROS (azul/roxo corporativo feio)
- Seguir o `design.md` existente: estilo Airbnb (off-white `#F7F7F9`, cards brancos com sombras difusas, cores por categoria em tons suaves, tipografia Inter)
- BottomNavBar: fundo escuro/card com bordas arredondadas pill, labels animados

## 5. Dependências Novas

- `framer-motion` (para animação do BottomNavBar)

## 6. Verificação

### Manual

- Abrir o preview do Lovable após o push e navegar pelas 4 abas
- Verificar que a Timeline carrega dados do Supabase
- Verificar que o SmartAdd continua funcionando
- Verificar que o Calendário mostra o mês atual
- Verificar que a página de Análise exibe os cards de métricas
