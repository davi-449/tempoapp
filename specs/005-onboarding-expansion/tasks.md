# 📋 Tasks (Plano de Ação) — Módulo 005 (Onboarding Expansion)

## 1. Supabase Crash Fix

- [x] Incorporar rotina de _Ghost Insert_ em todos os Onboardings (`Work`, `Study`, `Workout`, `General`). Se o ID for de uma _mock category_ (ex: `default-x`), o sistema efetua disparo `insert` antes e resgata o UUID real.
- [x] Alterar o `category.name` por `category_id: realUUID` em TODOS os formuladores preditivos de `tasks`.
- [x] Verificar a warning de ForwardRef do React no `CategoriesHub` (Possivelmente envolvendo o component `<AnimatedTabs />`).

## 2. Expansão UI: Treino (Workout)

- [x] Adicionar fields capturadores em `WorkoutOnboarding.tsx` para Medidas (Altura e Peso).
- [x] Embutir lógica de cálculo no payload do formulário.

## 3. Expansão UI: Trabalho (Work)

- [x] Adicionar field Empresa no fluxo de Start do Work.

## 4. Expansão Intensa UI: Estudos (Study)

- [x] Componentizar a parte de listagem de matérias, ou reconstruir os cases de Framer Motion do `StudyOnboarding` para coletar: Instuição, Matéria e Professor.
- [x] Ajustar a injeção em massa no D+N (`handleFinish`) para montar cards bonitos na timeline contendo "Professor: XYZ / Matéria: YZX".
