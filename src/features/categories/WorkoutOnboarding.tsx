import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/data';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight } from 'lucide-react';

interface WorkoutOnboardingProps {
  category: Category;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
};

export function WorkoutOnboarding({ category, onComplete }: WorkoutOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [days, setDays] = useState<number[]>([]);
  const [division, setDivision] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  
  // New Metrics
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const toggleDay = (dayIndex: number) => {
    setDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      if (days.length === 0) throw new Error("Selecione os dias de treino.");

      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      // Cálculo de IMC básico
      const w = parseFloat(weight);
      const h = parseFloat(height) / 100;
      const bmi = (w > 0 && h > 0) ? (w / (h * h)).toFixed(1) : null;

      // 1. Atualizar ou Inserir a Categoria com UUID real
      const currentSettings = (category as any).settings || {};
      const newSettings = {
         ...currentSettings,
         isConfigured: true,
         type: 'workout',
         schedule: { days, division, duration },
         healthMetrics: { weight, height, bmi }
      };

      let realCategoryId = category.id;
      if (category.id.startsWith('default-')) {
        const { data, error } = await (supabase as any).from('categories').insert({
          name: category.name,
          color: category.color,
          emoji: category.emoji,
          settings: newSettings,
          user_id: userId
        }).select().single();
        if (error) throw error;
        realCategoryId = data.id;
      } else {
        await (supabase as any).from('categories').update({ settings: newSettings }).eq('id', realCategoryId);
      }

      // 2. Gerar Tarefas com o realCategoryId
      const insertPayloads = [];
      const today = new Date();
      
      for (let i = 0; i < 28; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        
        if (days.includes(targetDate.getDay())) {
           targetDate.setHours(18, 0, 0, 0);

           let titleBase = `Meu Treino: ${division}`;
           if (division === 'ABC') {
             const workoutDay = ['A (Peito/Tríceps)', 'B (Costas/Bíceps)', 'C (Pernas/Ombro)'];
             titleBase = `Treino ${workoutDay[i % 3]}`;
           }

           insertPayloads.push({
             title: titleBase,
             category: category.name, // Keep string backward compat for UI if needed, but DB uses category_id primarily now if column exists. Wait, the DB only uses 'category' as string per the current schema, unless 'category_id' was added. Let's send both.
             category_id: realCategoryId,
             status: 'pending',
             start_time: targetDate.toISOString(),
             estimated_duration_minutes: duration,
             task_type: 'workout',
             user_id: userId
           });
        }
      }

      if (insertPayloads.length > 0) {
        await supabase.from('tasks').insert(insertPayloads);
      }
      
      onComplete();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Tivemos um problema. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 flex-1 py-10 h-full min-h-[400px]">
             <div className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center mb-2 shadow-2xl" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
              <span className="text-4xl">{category.emoji}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-balance">
              Vamos construir seu corpo no <span style={{color: category.color}}>Treino</span>!
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Diga-me suas medidas e horários. Montarei 4 semanas de treinos hiper focados pra você.
            </p>
            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl" onClick={() => paginate(1)}>
               Montar Grade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 1:
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Suas Métricas (Opcional)</h2>
               <p className="text-muted-foreground text-sm">Usaremos para calcular evolução e baseline de saúde.</p>
             </div>
             <div className="flex items-center justify-between gap-4 mt-6">
                <div className="flex-1 space-y-2">
                   <label className="text-sm font-medium text-muted-foreground pl-1">Peso (kg)</label>
                   <input type="number" placeholder="Ex: 75.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-4 rounded-xl border-2 bg-background font-medium text-lg text-center" />
                </div>
                <div className="flex-1 space-y-2">
                   <label className="text-sm font-medium text-muted-foreground pl-1">Altura (cm)</label>
                   <input type="number" placeholder="Ex: 180" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-4 rounded-xl border-2 bg-background font-medium text-lg text-center" />
                </div>
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" onClick={() => paginate(1)}>
                 Avançar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
           </div>
        );
      
      case 2:
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Quais dias na semana?</h2>
               <p className="text-muted-foreground text-sm">Selecione todos os seus dias típicos de treino.</p>
             </div>
             <div className="flex flex-wrap gap-3 justify-center mt-4">
                {weekDays.map((d, index) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(index)}
                    className={`h-14 w-14 rounded-full font-medium border-2 transition-all ${
                      days.includes(index) 
                        ? 'border-foreground bg-foreground text-background scale-105 shadow-xl' 
                        : 'border-border/50 bg-white text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={days.length === 0} onClick={() => paginate(1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        const divs = ['Full Body', 'ABC', 'Push/Pull/Legs', 'Crossfit', 'Cardio'];
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Qual sua divisão de Treino?</h2>
               <p className="text-muted-foreground text-sm">Ex: Musculação ABC ou Full Body.</p>
             </div>
             <div className="grid grid-cols-2 gap-3 mt-4">
                {divs.map(d => (
                  <button key={d} onClick={() => setDivision(d)} 
                    className={`py-4 rounded-2xl font-medium border-2 transition-all ${division === d ? 'border-foreground bg-foreground text-background scale-[1.02] shadow-xl' : 'border-border/50 bg-white text-muted-foreground hover:border-foreground/30'}`}>
                    {d}
                  </button>
                ))}
             </div>
             <div className="mt-auto pt-8">
              <Button size="lg" className="w-full rounded-2xl py-6" disabled={!division || isSubmitting} onClick={handleFinish}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Mapear Minha Saúde e Finalizar'}
              </Button>
            </div>
           </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-background overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="w-full max-w-sm absolute top-10">
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
