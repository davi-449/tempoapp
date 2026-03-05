# Design e Arquitetura — 004 Dynamic Onboarding

## 1. Visão de UI (Framer Motion)

Continuamos usando Variants (`slideVariants`) para interações horizontais, porém cada arquivo cuidará do seu próprio array de `step`.

### Fluxo de Trabalho (WorkOnboarding)

- **Step 0**: Intro ("Vamos configurar sua rotina de Trabalho").
- **Step 1**: Job Title & Escopo Principal (Input Text).
- **Step 2**: Dias úteis (Seg, Ter, Qua, Qui, Sex - Multi-select Pílulas).
- **Step 3**: Horário Base (Entrada, Saída, Almoço - Time Pickers Nativos ou select customizado).

### Fluxo de Treino (WorkoutOnboarding)

- **Step 0**: Intro
- **Step 1**: Dias de Treino na semana (Multi-select)
- **Step 2**: Tipo de Treino/Divisão (Musculação ABC, Cardio, etc)
- **Step 3**: Duração média.

## 2. Modelagem de Dados

Em vez de um `{ isConfigured: true, goal, frequency }` fixo, o payload do `settings` da `$category` passará a guardar metadados do form:

```json
{
  "isConfigured": true,
  "type": "work",
  "workload": {
    "days": [1, 2, 3, 4, 5],
    "start": "09:00",
    "end": "18:00",
    "lunch": "12:00"
  }
}
```

## 3. Lógica de Agendamento (Generator Script)

Diferente da V1 que criava `tasks` com status pending sem horários corretos, os novos generators irão:

1. Iterar os próximos 14 dias (`Date` atual + index).
2. Pular dias que não constam no `schedule` do form via `.getDay()`.
3. Para dias válidos, construir uma Date ISOS com a Hora preenchida e gerar a Task (ex: Task "Expediente" das 09h às 12h, break 12h, Retorno 13h às 18h).
