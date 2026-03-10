#!/bin/bash

# 1. Atualizar Botões de Dias da Semana (Bolinhas)
sed -i 's/border-foreground bg-foreground text-background scale-105 shadow-xl/border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary\/40/g' src/features/categories/*Onboarding.tsx
sed -i 's/border-border\/50 bg-white text-muted-foreground hover:border-foreground\/30/border-border\/50 bg-secondary\/40 text-muted-foreground hover:border-primary\/50 hover:bg-secondary\/60/g' src/features/categories/*Onboarding.tsx

# 2. Atualizar Botões de Divisão/Frequência (Cards retangulares)
sed -i 's/border-foreground bg-foreground text-background scale-\[1.02\] shadow-xl/border-primary bg-primary text-primary-foreground scale-\[1.03\] shadow-lg shadow-primary\/40/g' src/features/categories/*Onboarding.tsx

# 3. Atualizar Inputs de Texto com linha embaixo (Work, General, Study)
sed -i 's/className="w-full text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground\/40 transition-colors"/className="w-full text-center text-2xl bg-transparent border-b-2 border-border\/50 font-bold focus:outline-none focus:border-primary pb-3 placeholder:text-muted-foreground\/30 transition-all"/g' src/features/categories/*Onboarding.tsx

# 4. Atualizar Inputs Numéricos (Workout)
sed -i 's/className="w-full p-4 rounded-xl border-2 bg-background font-medium text-lg text-center"/className="w-full p-4 rounded-2xl border-2 border-border\/50 bg-secondary\/30 font-bold text-xl text-center focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20 transition-all shadow-sm"/g' src/features/categories/WorkoutOnboarding.tsx

# 5. Atualizar Input de Tempo Grande (Workout)
sed -i 's/className="p-4 rounded-xl border-2 bg-background font-medium text-3xl text-center w-48"/className="p-4 rounded-2xl border-2 border-border\/50 bg-secondary\/30 font-bold text-4xl text-center w-48 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20 transition-all shadow-sm"/g' src/features/categories/WorkoutOnboarding.tsx

# 6. Atualizar Inputs de Tempo Médios (Work)
sed -i 's/className="w-full p-4 rounded-xl border-2 bg-background font-medium text-lg"/className="w-full p-4 rounded-2xl border-2 border-border\/50 bg-secondary\/30 font-bold text-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary\/20 transition-all shadow-sm"/g' src/features/categories/WorkOnboarding.tsx

# 7. Atualizar Inputs do Form de Estudos (Study)
sed -i 's/className="w-full p-3 rounded-xl border-2 bg-background font-medium focus:border-foreground outline-none"/className="w-full p-4 rounded-2xl border-2 border-border\/50 bg-secondary\/30 font-medium focus:border-primary focus:ring-4 focus:ring-primary\/20 outline-none transition-all"/g' src/features/categories/StudyOnboarding.tsx
sed -i 's/className="flex-1 p-3 rounded-xl border-2 bg-background font-medium focus:border-foreground outline-none text-sm"/className="flex-1 p-4 rounded-2xl border-2 border-border\/50 bg-secondary\/30 font-medium focus:border-primary focus:ring-4 focus:ring-primary\/20 outline-none text-sm transition-all"/g' src/features/categories/StudyOnboarding.tsx
sed -i 's/className="p-2 rounded-xl border-2 bg-background font-medium text-sm w-\[90px\]"/className="p-3 rounded-2xl border-2 border-border\/50 bg-secondary\/30 font-medium text-sm w-[100px] focus:border-primary focus:ring-4 focus:ring-primary\/20 outline-none transition-all"/g' src/features/categories/StudyOnboarding.tsx

# 8. Atualizar Botões Principais (Avançar/Finalizar) para ficarem mais "Clicáveis" e bonitos
sed -i 's/className="w-full rounded-2xl py-6"/className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg shadow-primary\/30 transition-all hover:scale-\[1.02\] active:scale-95"/g' src/features/categories/*Onboarding.tsx
sed -i 's/className="w-full mt-4 py-6 rounded-2xl"/className="w-full mt-4 py-6 rounded-2xl font-bold text-lg shadow-lg shadow-primary\/30 transition-all hover:scale-\[1.02\] active:scale-95"/g' src/features/categories/*Onboarding.tsx

