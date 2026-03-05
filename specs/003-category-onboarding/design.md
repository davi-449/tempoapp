# 🛠️ Design & Arquitetura: Onboarding Dinâmico de Categorias (003)

## 1. Visão de UI (Integração Front-end)

### Componente CategoriesHub (A Tela Central)

- Substitui a necessidade de "Esconder Navbars". A tela em si **fará parte** do Navigation inferior (Hub).
- No topo, usaremos as `<AnimatedTabs />`.
  - **Tab 1:** Dashboard Geral (Resumo das categorias, igual estava no home anterior ou um formato listado).
  - **Tabs 2, 3, 4:** As categorias dinâmicas (Treino, Pessoal, etc).
- Ao entrar em uma aba dedicada que não possui o `settings.isConfigured`, o componente `<CategoryOnboarding />` toma o corpo da página substituindo a lista de tarefas.
- **Transições Visuais**: Uso pesado do `framer-motion` no Wizard Onboarding (botões grandes tap-bounce com cores neutras que acendem ao clique).

## 2. Modelagem de Dados (Supabase)

### Tabela Categories

Como já resolvemos a tipagem, não precisamos de tabela nova. Vamos utilizar a tabela `categories` existente:

- Deve possuir uma coluna chamada `settings` do tipo `jsonb` (Padrão nativo para configs dinâmicas postgres).

A lógica do FrontEnd será:

```typescript
interface RoutineSettings {
  isConfigured: boolean;
  daysOfWeek?: number[]; // [1, 3, 5] (Seg, Qua, Sex)
  baseDurationMinutes?: number;
  goals?: string; // "hipertrofia", "projetos", etc.
  [key: string]: any;
}
```

### Inteligência de Agenda (Generation Logic)

Se a pessoa configurar "Treino na Seg, Qua, Sex", a aplicação irá criar tarefas recorrentes atômicas disparando um `insert` múltiplo para os próximos 30 dias na tabela `tasks` na Categoria atrelada.
As queries no `TaskEditSheet` que criamos anteriormente cuidarão de modificar cada treino separadamente.

## 3. Integração na View

Em `CategoriesHub.tsx`, a lógica de conteúdo interno das abas dinâmicas verificará:

```tsx
const isConfigured = activeCategory?.settings?.isConfigured;

if (!isConfigured && activeCategory) {
  return (
    <CategoryOnboarding
      category={activeCategory}
      onComplete={() => refetch()}
    />
  );
}
```
