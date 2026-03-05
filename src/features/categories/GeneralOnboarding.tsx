import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Category, Subtask } from '@/types/data';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2, ArrowRight, Play } from 'lucide-react';

interface GeneralOnboardingProps {
  category: Category;
  onComplete: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

type RoutineFrequency = '1x' | '2x' | '3x' | '4x' | '5x' | 'daily';

export function GeneralOnboarding({ category, onComplete }: GeneralOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [goal, setGoal] = useState<string>('');
  const [frequency, setFrequency] = useState<RoutineFrequency | null>(null);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setStep(step + newDirection);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Logic to create recurrent tasks 
      // (This creates empty baseline tasks based on frequency)
      // Here we simulate generating them for the next 14 days
      
      const insertPayloads = [];
      const today = new Date();
      let daysCount = 0;
      
      switch (frequency) {
        case 'daily': daysCount = 14; break;
        case '5x': daysCount = 10; break;
        case '4x': daysCount = 8; break;
        case '3x': daysCount = 6; break;
        case '2x': daysCount = 4; break;
        case '1x': daysCount = 2; break;
        default: daysCount = 2;
      }

      for (let i = 0; i < daysCount; i++) {
         const targetDate = new Date();
         // Just a dumb schedule spreading over 14 days
         targetDate.setDate(today.getDate() + (i * Math.floor(14/daysCount)));
         
         insertPayloads.push({
           title: `Minha Rotina de ${category.name}`,
           category: category.name,
           status: 'pending',
           description: goal ? `Meta: ${goal}` : '',
           start_time: targetDate.toISOString(),
           task_type: category.name.toLowerCase() === 'treino' ? 'workout' : 'task',
           user_id: (await supabase.auth.getUser()).data.user?.id
         });
      }

      if (insertPayloads.length > 0) {
        await supabase.from('tasks').insert(insertPayloads);
      }

      // 2. Update category settings
      const currentSettings = (category as any).settings || {};
      const newSettings = {
         ...currentSettings,
         isConfigured: true,
         goal,
         frequency
      };

      // @ts-ignore
      await (supabase as any).from('categories').update({ settings: newSettings }).eq('id', category.id);
      
      onComplete();
    } catch (e) {
      console.error(e);
      alert('Tivemos um problema. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 flex-1 py-10 h-full min-h-[400px]">
            <div 
              className="w-20 h-20 rounded-3xl flex flex-col items-center justify-center mb-2 shadow-2xl"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              <span className="text-4xl">{category.emoji}</span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-balance">
              Vamos dominar sua área de <span style={{color: category.color}}>{category.name}</span>!
            </h2>
            
            <p className="text-muted-foreground text-sm max-w-[280px]">
              Para economizar seu tempo, vou configurar algumas tarefas semanais automaticamente pra você.
            </p>

            <Button size="lg" className="w-full mt-4 py-6 rounded-2xl" onClick={() => paginate(1)}>
              Começar Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 1:
        return (
          <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
            <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Qual sua meta principal?</h2>
               <p className="text-muted-foreground text-sm">Resuma o que deseja alcançar (ex: perder peso, fechar projetos, estudar React).</p>
            </div>
            
            <input 
              type="text" 
              autoFocus
              className="w-full text-center text-xl bg-transparent border-b-2 font-medium focus:outline-none focus:border-foreground pb-2 placeholder:text-muted-foreground/40 transition-colors"
              placeholder="Ex: Evoluir nos estudos"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />

            <div className="mt-auto pt-8">
              <Button 
                size="lg" 
                className="w-full rounded-2xl py-6"
                disabled={!goal.trim()}
                onClick={() => paginate(1)}
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        const freqs = ['1x', '2x', '3x', '4x', '5x', 'daily'];
        
        return (
           <div className="flex flex-col space-y-8 flex-1 py-10 h-full min-h-[400px]">
             <div className="space-y-2 text-center">
               <h2 className="text-2xl font-bold tracking-tight">Qual a frequência?</h2>
               <p className="text-muted-foreground text-sm">Para criarmos as rotinas no seu calendário.</p>
             </div>
             
             <div className="grid grid-cols-2 gap-3 mt-4">
                {freqs.map(f => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f as RoutineFrequency)}
                    className={`py-4 rounded-2xl font-medium border-2 transition-all ${
                      frequency === f 
                        ? 'border-foreground bg-foreground text-background scale-[1.02] shadow-xl' 
                        : 'border-border/50 bg-white text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {f === 'daily' ? 'Todo dia' : f + ' na semana'}
                  </button>
                ))}
             </div>

             <div className="mt-auto pt-8">
              <Button 
                size="lg" 
                className="w-full rounded-2xl py-6"
                disabled={!frequency || isSubmitting}
                onClick={handleFinish}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Setup e Gerar Agenda'}
              </Button>
            </div>
           </div>
        );
    }
  };


  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-background overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
           key={step}
           custom={direction}
           variants={slideVariants}
           initial="enter"
           animate="center"
           exit="exit"
           transition={{
             x: { type: "spring", stiffness: 300, damping: 30 },
             opacity: { duration: 0.2 }
           }}
           className="w-full max-w-sm absolute top-10"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
