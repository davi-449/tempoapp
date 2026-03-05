# Design & Architecture — 005 (Onboarding Expansion & Bugfix)

## 1. Solucionando a Barreira de Banco de Dados

```javascript
// Antes (Quebrado):
await supabase
  .from("categories")
  .update({ settings: newSettings })
  .eq("id", "default-2");

// Depois (Inteligente - Upsert/Insert under the hood):
let realCategoryId = category.id;
if (category.id.startsWith("default-")) {
  // Insere no banco e rouba o ID Real
  const { data } = await supabase
    .from("categories")
    .insert({
      name: category.name,
      color: category.color,
      emoji: category.emoji,
      settings: newSettings,
      user_id: session.user.id,
    })
    .select()
    .single();
  realCategoryId = data.id;
} else {
  // Apenas Atualiza
  await supabase
    .from("categories")
    .update({ settings: newSettings })
    .eq("id", realCategoryId);
}
```

## 2. Visão de UI Estendida (Framer Motion Wizards)

### 2.1 Study Onboarding (Estudos)

O módulo de estudos precisa crescer para não ser só "Tempo de Foco", mas "Grade Horária".

- **Step 1**: Instituição ("Onde você estuda?")
- **Step 2**: Matérias & Professores (Input duplo + Botão Add -> Array)
- **Step 3**: Conexão Dia da Semana <-> Matéria. (Ex: "Segunda-feira você tem aula de quê?")
- **Step 4**: Tempo de grade em aula X Tempo de estudos em casa. (O sistema vai agendar ambas no Supabase, separando aulas estáticas de slots de lição de casa).

### 2.2 Workout Onboarding (Treino)

- **Step 1**: Propósito & Modalidade (Musculação, Cardio, Calistenia).
- **Step 2**: Peso (kg) e Altura (cm). O JSONB salvará o IMC (BMI) calculado automaticamente sob o capô na key `settings.healthMetrics`.
- **Step 3**: Dias da semana & Duração.
- **Step 4**: Divisão/Grade selecionável.

### 2.3 Work Onboarding (Trabalho)

- **Step 1**: Qual o cargo?
- **Step 2**: Qual a Empresa/Instituição? (Novo)
- **Step 3 & 4**: Dias e Horários (Entrada, Almoço e Saída).

## 3. Estrutura do DB Tracking

A correção vital nas queries de `tasks`:

```javascript
insertPayloads.push({
  title: "Lógica Preditiva",
  category_id: realCategoryId, // CORRETO! Não 'category': 'Nome'
  //...
});
```
